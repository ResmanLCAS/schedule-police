export interface LineWebhookEvent {
    type: string;
    timestamp: number;
    source: {
        type: string;
        groupId?: string;
        userId: string;
    };
}

export interface LineWebhookMessagePayload extends LineWebhookEvent {
    message: {
        id: string;
        type: string;
        quoteToken: string;
        text: string;
        markAsReadToken: string;
    };
    replyToken: string;
}
