let stompClient=null;
let user= null;
const socket=new SockJS('/ws-endpoints'); // SockJS is the lib that help connect with browser to servers using W-S.
stompClient=Stomp.over(socket);//wrap websocket connection with stomp for send and recive msg.

stompClient.connect({},()=>{
    console.log('Connected to websocket server')

   // it receive the msg 
       stompClient.subscribe('/topic/messages',(message)=>{
        // console.log('Received message:', message);

        const li = document.createElement('li');
        const msg=JSON.parse(message.body);
        li.innerHTML=msg.content + "(by "+ msg.sender + " a "+ msg.timeStamp + ")";

         const messageList= document.getElementById('messageList');
         messageList.appendChild(li);
    });
    
});

function sendmessage(){
            const message=document.getElementById("messageinput").value;
            // console.log('Sending message:', message);

            stompClient.send("/app/chat",{},JSON.stringify(
                {
                  'sender': user,
                  'content': message,
                  'type': 'Chat',
                  'timeStamp' : new Date().toISOString()  
                }
                
            ));
            
        }


        function connect(){
            user=document.getElementById('uname').value
            document.getElementById('Login').style.display='none';
            document.getElementById('msgblock').style.display='none';
            document.getElementById('username').innerText="You are logged as"+ user;

        }

        