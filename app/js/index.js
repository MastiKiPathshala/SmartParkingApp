var uuid;
var wsBroker = "128.199.173.29";  //mqtt websocket enabled broker ip address
var dataPort = 9001    // Port for Data exchange
var mgmtPort = 5000  // Port for contacting AAA server
var client = new Paho.MQTT.Client (wsBroker, dataPort, "myclientid_" + parseInt(Math.random() * 100, 10));
var token = '';
var LoginScreen = $(".overlay");
var app = {

    login: function (){
        var UserName = $("#UserName").val(),
            password = $("#password").val();
            console.log(UserName,password)
        $.ajax({
            type: "POST",
            url: "http://" + wsBroker + ":" + mgmtPort + "/login",
            timeout: 2000,
            dataType : "json",
            contentType :"application/x-www-form-urlencoded",
            data: { "UserName": UserName, "password": password },
            success: function(data) {
                console.log("==>",data.statusresp);
                console.log("<===>",data)
                // alert(data.statusresp);
                if(data.statusresp == "no existing user"){
                    alert('error !! no existing user')
                }
                else if(data.statusresp == "wrong password"){
                    alert('error !! wrong password')
                }
                else{
                    token = data.token;
                    app.MQTTInit();
                }
            },
            error: function(err) {
                alert('error !!');
            }
        });

    },

    initialize: function() {
        uuid = this.generateUUID();
    },

    generateUUID: function () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=='x' ? r : (r&0x3|0x8)).toString(16);
        });
        return uuid;
    },
    
    MQTTInit: function() {
        LoginScreen.fadeOut(1000);
        setTimeout(function(){
            LoginScreen.css("z-index","-10");
        },1000);
        console.log("token :",token)
    	var options = {
            timeout: 3,
    	    onSuccess: function () {
                console.log("mqtt connected");
    	        console.log("Started Subscribing ...");
        	    client.subscribe('parkingstatus-resp', {qos: 1});
        	    client.subscribe('wait_time_resp', {qos: 1});
                   
        	    client.onMessageArrived = function (message) {
                    console.log(message.payloadString) 
                    var msg = JSON.parse(message.payloadString)
                    if(msg.Requester == "Analytics") {
                        if ((msg.Userid == uuid) && (msg.parking_lot_id == token)) {
                            alert("Parking space "+ msg.parking_id+" will be free in "+msg.wait_time+ " min(s)");
                        }    
                    }else if(msg.Requester == 'Device'){
                        if (msg.parking_lot_id == token) {
                            app.pageupdate(message);
                        } 
                    }else{
                        console.log(msg);
                        console.log("errorMessage format")
                    }
          		    

        		};
    		    client.onConnectionLost = function (responseObject) {
    	      	    console.log("connection lost: " + responseObject.errorMessage);
    	    	};
            },
	    onFailure: function (message) {
	           console.log("Connection failed: " + message.errorMessage);
	    }
	};
    	
        client.connect(options);
    
    },
    publishMsg: function (data){
        console.log(data)
        message = new Paho.MQTT.Message(data);
        message.destinationName = "wait_time_req";
        client.send(message);
    },
    checkAvailability: function(){
        var currentDate = moment(new Date).tz('Asia/Kolkata').format('YYYY-MM-DD HH:MM:SS')
        console.log(currentDate)
        data = JSON.stringify({"Requester": "APP","Timestamp": currentDate,"Userid": uuid, "parkingLotId": token});
        app.publishMsg(data); 
           
    },
    pageupdate: function (message){
        var messagepayloadString = JSON.parse(message.payloadString);
        console.log("received message : ",messagepayloadString);

        $.mobile.loading( "hide" );
        var parking_slot = document.getElementById("svg_"+(messagepayloadString.parking_id).toString());

        if (messagepayloadString.parking_status == 0) {
           parking_slot.setAttribute("fill", "green"); 
        } else if (messagepayloadString.parking_status == 1) {
           parking_slot.setAttribute("fill", "red"); 
        }            
    },
};

app.initialize();