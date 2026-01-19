package com.chatwebapp.livechat.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.chatwebapp.livechat.model.ChatMessage;

@Controller
public class chatcontroller {
    
    @GetMapping("/")
    public String home(){
        return "home";
    }
    
    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public ChatMessage recevieMessage (ChatMessage message){
        System.out.println("Receive message"+message.getContent());
        return message;
    }
}
