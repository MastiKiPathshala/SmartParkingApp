var uuid;
var wsbroker = "162.242.215.7";  //mqtt websocket enabled broker ip address
var wsport = 9001 // port for above
var client = new Paho.MQTT.Client(wsbroker, wsport,"myclientid_" + parseInt(Math.random() * 100, 10));

var app = {

    initialize: function() {
        uuid = this.generateUUID();
        this.MQTTInit();
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
                    if(msg.Requester == "Analytics"){
                        if(msg.Userid == uuid){
                            alert("Parking space "+ msg.parking_id+" will be free in "+msg.wait_time+ " min(s)");
                        }    
                    }else if(msg.Requester == 'Device'){
                        app.pageupdate(message); 
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
        data = JSON.stringify({"Requester": "APP","Timestamp": currentDate,"Userid":uuid});
        app.publishMsg(data); 
           
    },
    pageupdate: function (message){
        var messagepayloadString = JSON.parse(message.payloadString);
        console.log("received message : ",messagepayloadString);

        $.mobile.loading( "hide" );
        var parking_slot = document.getElementById("svg_"+(messagepayloadString.parking_id).toString());

        if(messagepayloadString.parking_status == 0){
           parking_slot.setAttribute("fill", "green"); 
        }
        else if(messagepayloadString.parking_status == 1){
           parking_slot.setAttribute("fill", "red"); 
        }            
    },
};

app.initialize();