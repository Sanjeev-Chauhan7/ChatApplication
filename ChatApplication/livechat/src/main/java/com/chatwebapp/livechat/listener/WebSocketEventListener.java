package com.chatwebapp.livechat.listener;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.chatwebapp.livechat.model.ChatMessage;
import com.chatwebapp.livechat.model.MessageType;

@Component
public class WebSocketEventListener {

    // Maps sessionId -> username
    private static final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    public static void registerUser(String sessionId, String username) {
        if (sessionId != null && username != null) {
            sessionUserMap.put(sessionId, username);
        }
    }

    public static int getActiveUserCount() {
        return sessionUserMap.size();
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        if (sessionId != null) {
            String username = sessionUserMap.remove(sessionId);
            
            if (username != null) {
                System.out.println("User Disconnected: " + username + " (session: " + sessionId + ")");
                
                // Create and broadcast a LEAVE message
                ChatMessage chatMessage = new ChatMessage();
                chatMessage.setType(MessageType.LEAVE);
                chatMessage.setSender(username);
                chatMessage.setContent(username + " left the chat");
                chatMessage.setTimeStamp(java.time.Instant.now().toString());
                
                messagingTemplate.convertAndSend("/topic/messages", chatMessage);
            }
            
            // Broadcast the updated user count to all clients
            broadcastUserCount();
        }
    }

    public void broadcastUserCount() {
        int count = sessionUserMap.size();
        messagingTemplate.convertAndSend("/topic/userCount", count);
    }
}
