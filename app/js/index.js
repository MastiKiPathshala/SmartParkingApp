var app = {
    initialize: function() {
        this.bindEvents();
        this.MQTTInit();
    },
    
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        $.mobile.loading( "show", {
                    text: "Fetching Current Status",
                    textVisible: true,
                    textonly: false            
        });   
    },

    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    },

    MQTTInit: function() {

    	var options = {
            timeout: 3,
    	    onSuccess: function () {console.log("mqtt connected");
    	  		// Connection succeeded; subscribe to our topic, you can add multile lines of these
    	        console.log("Subscribing..");
        	    client.subscribe('parkingstatus-resp', {qos: 1});

        	   
        	    client.onMessageArrived = function (message) {
                    console.log(message);
          		    console.log(message.destinationName, ' -- ', message.payloadString); 
          		    pageupdate(message); 

        		};
    		    client.onConnectionLost = function (responseObject) {
    	      	    console.log("connection lost: " + responseObject.errorMessage);
    	    	};	        
        	},
	        onFailure: function (message) {
	           console.log("Connection failed: " + message.errorMessage);
	        }
	    };

    	
        // --------- mqtt initialisation -----
        var wsbroker = "162.242.215.7";  //mqtt websocket enabled broker ip address
    	var wsport = 9001 // port for above
    	var client = new Paho.MQTT.Client(wsbroker, wsport,"myclientid_" + parseInt(Math.random() * 100, 10));
    	
    	client.connect(options);
       
        function pageupdate(message){
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
        }
    }
};

app.initialize();