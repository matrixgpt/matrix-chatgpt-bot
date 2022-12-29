type CommonMatrixEventFields = {
  origin_server_ts: number,
  sender: string,
  event_id: string
}

export type MessageEvent = CommonMatrixEventFields & {
  content: {
    body: string,
    msgtype: "m.text" | string
    "org.matrix.msc1767.text"?: string
  },
  "type": "m.room.message",
  unsigned: Object;
}

export type MatrixReactionEvent = CommonMatrixEventFields & {
  type: "m.reaction",
  content: {
    'm.relates_to'?: {
      event_id: string
      /** The emoji itself */
      key: string
    }
  }
}

export type MatrixJoinEvent = CommonMatrixEventFields & {
  type: "m.room.member",
  content: {
    membership: "join",
    displayname?: string,
    avatar_url: string | null
  }
  state_key?: string
  unsigned?: Object;
}

export type MatrixUsername = string;

export type MatrixInviteEvent = CommonMatrixEventFields & {
  content: {
    avatar_url: string | null,
    displayname: string,
    membership: "invite"
  },
  origin_server_ts: number,
  sender: MatrixUsername,
  state_key: MatrixUsername,
  type: "m.room.member",
  event_id: string
}
export type MembershipType = 'leave' | 'invite' | 'join'

export type StoredConversationConfig = {
    REQUIRE_MENTION_IN_REPLY?: boolean;
}

export type StoredConversation = {
    conversationId: string;
    messageId: string;
    now: number;
    config: StoredConversationConfig;
}
