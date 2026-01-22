import { messagingApi } from "@line/bot-sdk";

const { MessagingApiClient } = messagingApi;

export const lineMessagingApiClient = new MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export type PushMessageRequest = messagingApi.PushMessageRequest;
export type ReplyMessageRequest = messagingApi.ReplyMessageRequest;
export type TextMessageV2 = messagingApi.TextMessageV2;
export type Message = messagingApi.Message;
export type SubstitutionObject = messagingApi.SubstitutionObject;
export type MentionSubstitutionObject = messagingApi.MentionSubstitutionObject;
