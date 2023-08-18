/// <reference lib="webworker" />
/// <reference types="vite/client" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import {PushMessage} from "./lib/push/PushMessage";
import {pushMessagesDb} from "./lib/component/messages/messagesDb";

declare let self: ServiceWorkerGlobalScope

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING')
        self.skipWaiting()
})

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST)

// clean old assets
cleanupOutdatedCaches()

let allowlist: undefined | RegExp[]
if (import.meta.env.DEV)
    allowlist = [/^\/$/]

// to allow work offline
registerRoute(new NavigationRoute(
    createHandlerBoundToURL('/'),
    { allowlist },
))

self.addEventListener('push', (e) => {
    e.waitUntil(new Promise(function (resolve, reject) {
        const pushMessage = new PushMessage(e.data.text())
        if (!pushMessage.isHealthCheck()) {
            self.registration.showNotification(pushMessage.title, {
                body: pushMessage.body,
                icon: pushMessage.icon ?? undefined
            }).then(() => {
                return pushMessagesDb.addMessagePerTopic(pushMessage)
            }).finally(() => {
                resolve(null);
            })
        } else {
            console.log("health check message received");
            resolve(null);
        }
    }))
})