<script lang="ts">
    import {
        Badge,
        Button,
        Center,
        Flex,
        Grid,
        Group,
        Loader,
        Paper,
        Space,
        Stack,
        Text,
        ThemeIcon
    } from "@svelteuidev/core";
    import {onMount} from "svelte";
    import {Check, CheckCircled} from "radix-icons-svelte";
    import ClickablePaper from "$lib/ui/ClickablePaper.svelte";
    import {liveQuery} from "dexie";
    import {type Topic, topicListDb, TopicStatus} from "$lib/component/topics/topicsDb";
    import {pushEndpointStore, pushGrantedStore} from "$lib/push/PushStore";


    // about notification permission
    const requestPermission = () => {
        pushGrantedStore.set(Notification.requestPermission())
    }
    const badgeCssMap = new Map<string, {color: string, text: string}>();
    badgeCssMap.set("granted", {color: "blue", text: "GRANTED"})
    badgeCssMap.set("default", {color: "green", text: "DEFAULT"})
    badgeCssMap.set("denied", {color: "red", text: "DENIED"})
    badgeCssMap.set("fallback", {color: "gray", text: "UNKNOWN"})
    const getCssOfBadge = (value: string): {color: string, text: string} => {
        return badgeCssMap.get(value) ? badgeCssMap.get(value) : badgeCssMap.get("fallback")
    }
    let cssBadge: {color: string, text: string};
    pushGrantedStore.subscribe(value => {
        cssBadge = getCssOfBadge(value);
    })

    interface ViewTopics extends Topic {
        processing: boolean;
    }
    let allTopics: ViewTopics[] = []
    let allTopicsRawQuery = liveQuery(
        () => topicListDb.topic.toArray()
    )
    // about topic list
    pushEndpointStore.subscribe(pushInfo => {
        topicListDb.updateSubscribedTopics().then(() => {
            topicListDb.topic.toArray().then(subs => {
                allTopics = subs.map(sub => {
                    return {
                        uuid: sub.uuid,
                        name: sub.name,
                        description: sub.description,
                        isSubscribed: sub.isSubscribed,
                        processing: false
                    }
                }).sort((a, b) => a.name < b.name ? 1 : -1)
            })
        })
    })
    allTopicsRawQuery.subscribe(allRawTopics => {
        allTopics = allRawTopics.map(sub => {
            const res: ViewTopics = {
                uuid: sub.uuid,
                name: sub.name,
                description: sub.description,
                isSubscribed: sub.isSubscribed,
                processing: false
            }
            return res;
        }).sort((a, b) => a.name < b.name ? 1 : -1)
    })
    $: {
        allTopics = allTopics
    }

    let isRefreshing = false;
    let isRefreshed = false;
    onMount(() => {
        topicListDb.updateAllTopics();
    })
    const refreshTopicListByButton = () => {
        isRefreshing = true;
        topicListDb.updateAllTopics().then(() => {
            isRefreshing = false;
            isRefreshed = true;
            setTimeout(() => {
                isRefreshed = false;
            }, 1500)
        });
    }

    const subscribe = (uuid: string) => {
        const index = allTopics.findIndex(sub => sub.uuid === uuid)
        allTopics[index].processing = true;
        topicListDb.subscribeToTopic(uuid).then(() => {
            const index = allTopics.findIndex(sub => sub.uuid === uuid)
            allTopics[index].processing = false;
        })
    }

    const unsubscribe = (uuid: string) => {
        const index = allTopics.findIndex(sub => sub.uuid === uuid)
        allTopics[index].processing = true;
        topicListDb.unsubscribeFromTopic(uuid).then(() => {
            const index = allTopics.findIndex(sub => sub.uuid === uuid)
            allTopics[index].processing = false;
        })
    }

    const subscribeButtonCss = {
        padding: "8px",
        border: "0rem",
        width: "4.5rem",
        outline: "0px",
        display: "block",
        color: "black",
        borderRadius: "0.8rem",
        backgroundColor: "#F2F3F4",
        "&:hover": {
            backgroundColor: "#E6E8EB"
        },
    }
    const unsubscribeButtonCss = {
        padding: "8px",
        border: "0rem",
        width: "4.5rem",
        outline: "0px",
        display: "block",
        color: "black",
        borderRadius: "0.8rem",
        backgroundColor: "#F9E8E9",
        "&:hover": {
            backgroundColor: "#FDE4E5"
        },
    }
    const textCenterCss1 = {
        position: "relative",
        top: "50%",
        transform: "translateY(-50%)",
        height: "75%"
    }
</script>

<body>
    <Stack>
        <Grid>
            <Grid.Col span={5}>
                <Text align="right" override={textCenterCss1}>알림 권한 : </Text>
            </Grid.Col>
            <Grid.Col span={6} offset={1}>
                <Badge on:click={() => {requestPermission()}} color={cssBadge.color}>{cssBadge.text}</Badge>
            </Grid.Col>
        </Grid>
    </Stack>
    <Space h="md"/>
    <div class="scrollableList">
        <Stack spacing="sm">
            <ClickablePaper disabled={isRefreshing || isRefreshed} height="2.6rem"
                            padding="0.5rem" onClick={() => {refreshTopicListByButton()}}>
                {#if isRefreshing === false && isRefreshed === false}
                    <Text align="center">click to Refresh</Text>
                {:else if isRefreshing === true && isRefreshed === false}
                    <Group position="center">
                        <Text>Refreshing...</Text>
                        <Loader color="gray" size={4} />
                    </Group>
                {:else if isRefreshing === false && isRefreshed === true}
                    <Group position="center">
                        <Text>Refreshed!</Text>
                        <Check color="green" size={"1.6rem"} />
                    </Group>
                {/if}
            </ClickablePaper>
            {#each allTopics as topic}
                <Paper override={{padding: "0.5rem", backgroundColor: "white"}}>
                    <Flex justify="space-between">
                        <Stack spacing="sm">
                            <Group position="left">
                                <Text weight={"bold"}>{topic.name}</Text>
                                {#if topic.isSubscribed === TopicStatus.SUBSCRIBED}
                                    <ThemeIcon variant="white" radius="xs" size="xs">
                                        <CheckCircled />
                                    </ThemeIcon>
                                {/if}
                            </Group>
                            <Text>{topic.description}</Text>
                        </Stack>
                        <Center>
                            {#if topic.isSubscribed === TopicStatus.SUBSCRIBED}
                                <Button disabled={topic.processing} override={unsubscribeButtonCss}>
                                    {#if topic.processing === true}
                                        <Loader color="gray" size="sm"/>
                                    {:else}
                                        <Text color="#C13538" align="center" size="sm"
                                              on:click={() => {unsubscribe(topic.uuid)}}>구독 취소</Text>
                                    {/if}
                                </Button>
                            {:else if topic.isSubscribed === TopicStatus.UNSUBSCRIBED}
                                <Button disabled={topic.processing} override={subscribeButtonCss}>
                                    {#if topic.processing === true}
                                        <Loader color="gray" size="sm"/>
                                    {:else}
                                        <Text color="#4F5867" align="center" size="sm"
                                              on:click={() => {subscribe(topic.uuid)}}>구독</Text>
                                    {/if}
                                </Button>
                            {:else if cssBadge.text === "denied" || cssBadge.text === "fallback"}
                                <Button disabled={true} override={subscribeButtonCss}>
                                    <Text color="#4F5867" align="center" size="sm">권한 필요</Text>
                                </Button>
                            {:else}
                                <Button disabled={true} override={subscribeButtonCss}>
                                    <Text color="#4F5867" align="center" size="sm">ERROR</Text>
                                </Button>
                            {/if}
                        </Center>
                    </Flex>
                </Paper>
        {/each}
        </Stack>
    </div>
</body>

<style>
    body {
        padding-top: 1rem;
        height: 100%;
        margin: 0;
    }

    .scrollableList {
        height: calc(100% - 5rem);
        border: 1px solid #f2f4f6;
        border-radius: 1rem;
        overflow: scroll;
        padding: 0;
        margin: 0;
        --ms-overflow-style: none;
        scrollbar-width: none;
    }

    .scrollableList::-webkit-scrollbar {
        display: none;
    }
</style>