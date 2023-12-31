<script lang="ts">
    import {onMount} from "svelte";
    import {PUBLIC_PUSH_KEY} from "$env/static/public";
    import { fly } from "svelte/transition";
    import {sendSubscriptionToServer} from "$lib/push/PushRequests";
    import {Page, pageCurrentClicked} from "$lib/component/footer/footer.js";
    import Header from "$lib/component/header/Header.svelte";
    import MessagesPage from "$lib/component/messages/MessagesPage.svelte";
    import TopicsPage from "$lib/component/topics/TopicsPage.svelte";

    let lessThan400px = false;

    onMount(() => {
        navigator.serviceWorker.ready.then(serviceWorkerRegistration => {
                return serviceWorkerRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: PUBLIC_PUSH_KEY
            })
            .then(subscription => {
                return sendSubscriptionToServer(subscription)
            })
            .catch(exception => {
                if (Notification.permission === 'denied') {
                    console.log("Permission for Notification was denied");
                    alert("Permission for Notification was denied");
                } else {
                    console.error("Unable to subscribe to push", exception);
                    alert(`Unable to subscribe to push : ${exception}`)
                }
            })
        })
    })

    // UI
    const transitions = {
        appearLeft: {x: "-3rem", duration: 200},
        appearRight: {x: "3rem", duration: 200},
        disappearLeft: {x: "3rem", duration: 200},
        disappearRight: {x: "-3rem", duration: 200}
    }
    let pageTransitionLink = {
        messages: { t: transitions.appearLeft},
        topics: { t: transitions.appearLeft},
        setting: { t: transitions.appearLeft}
    }
    let currentPage;
    let currentTransition = { t: transitions.appearLeft};
    pageCurrentClicked.subscribe(newPage => {
        // set new Transition
        let newTransition;
        if (newPage === Page.MESSAGES) newTransition = pageTransitionLink.messages
        if (newPage === Page.TOPICS) newTransition = pageTransitionLink.topics
        if (newPage === Page.SETTINGS) newTransition = pageTransitionLink.setting

        // set transition
        if (newPage > currentPage) {
            currentTransition.t = transitions.disappearLeft;
            newTransition.t = transitions.appearRight;
        } else {
            currentTransition.t = transitions.disappearRight;
            newTransition.t = transitions.appearLeft;
        }
        currentTransition = newTransition;
        currentPage = newPage;
    })

    export let width, height;
    $: {
        lessThan400px = width < 400;
    }
</script>

<body bind:clientWidth={width} bind:clientHeight={height}>
    <div class="main">
        <div class="page">
            {#await import('$lib/component/settings/SettingPage.svelte') then { default: SettingPage} }
                {#if currentPage === Page.MESSAGES}
                    <div transition:fly={pageTransitionLink.messages.t} class="transition">
                        <Header />
                        <MessagesPage />
                    </div>
                {:else if currentPage === Page.TOPICS}
                    <div transition:fly={pageTransitionLink.topics.t} class="transition">
                        <Header />
                        <TopicsPage />
                    </div>
                {:else if currentPage === Page.SETTINGS}
                    <div transition:fly={pageTransitionLink.setting.t} class="transition">
                        <Header />
                        <SettingPage />
                    </div>
                {/if}
            {/await}
        </div>
    </div>
</body>

<style>
    body {
        display: flex;
        width: 100%;
        padding: 0;
        margin: 0;
    }

    .main {
        /*display: flex;*/
        flex: 1 1 auto;
        width: 100%;
    }

    .page {
        padding-top: 0.3rem;
        height: 91%;
        position: relative;
    }

    .transition {
        position: absolute;
        width: 100%;
        height: 100%;
    }
</style>
