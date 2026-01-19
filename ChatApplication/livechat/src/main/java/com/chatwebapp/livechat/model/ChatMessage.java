package com.chatwebapp.livechat.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
       private String sender;
       private String content;
       private MessageType type;
       private String timeStamp;
}
