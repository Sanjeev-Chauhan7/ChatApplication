package com.chatwebapp.livechat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import com.chatwebapp.livechat.model.ChatMessage;
import com.chatwebapp.livechat.model.MessageType;
import com.chatwebapp.livechat.listener.WebSocketEventListener;

@Controller
public class chatcontroller {
    
    @Autowired
    private WebSocketEventListener eventListener;
    
    // @GetMapping("/")
    // public String home(){
    //     return "home";
    // }
    
    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public ChatMessage recevieMessage (ChatMessage message, SimpMessageHeaderAccessor headerAccessor){
        System.out.println("Receive message: " + message.getContent());
        if (message.getType() == MessageType.JOIN) {
            String sessionId = headerAccessor.getSessionId();
            if (sessionId != null && message.getSender() != null) {
                WebSocketEventListener.registerUser(sessionId, message.getSender());
                headerAccessor.getSessionAttributes().put("username", message.getSender());
                // Broadcast updated user count
                eventListener.broadcastUserCount();
            }
        }
        return message;
    }
}

