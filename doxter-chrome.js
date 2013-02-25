// Get credentials and oauth from local storage
getSettings();
getAccessToken();

// Sync every 60 seconds
if(window.api_base_url && window.api_username && window.api_password) {
   
  window.interval = window.api_sync_every ? window.api_sync_every : 60;
  window.api_gcal_id = window.api_gcal_id ? window.api_gcal_id : 'primary';
  
  window.setInterval(function() {
    syncGoogleToDoxter();
  }, window.interval * 1000);

  // Always sync Google->Doxter first, wait 30 sec
  window.setTimeout(function() {
    window.setInterval(function() {
      syncDoxterToGoogle();
    }, window.interval * 1000);
  }, 30 * 1000);

}
else {
  alert("Go to options page and set base url, username and password!");
}


// Sync events from Google to Doxter
function syncGoogleToDoxter() {

  var url = "https://www.googleapis.com/calendar/v3/calendars/" + window.api_gcal_id + "/events";
  var params = {
    "updatedMin": (new Date(parseInt(window.api_last_synced_gtod))).toISOString(),
  }


  // Get events
  $.ajax({
    url: url + "?" + stringify(params),
    headers: {
      "Authorization": "OAuth " + window.access_token
    },
    success: function(data) {
      if(!data.items) {
        return;
      }
      for(i = 0; i < data.items.length; i++) {
        console.log("Saving event from Google to Doxter:");
        console.log(data.items[i]);

        var params = {
          "starts" : (new Date(data.items[i].start.dateTime)).toISOString(),
          "ends" : (new Date(data.items[i].end.dateTime)).toISOString()
        }
        // If id is found in description, reschedule
        if(data.items[i].description) {
          match = data.items[i].description.match(/DXID=(.*)$/);
          if(match) {
            params.id = match[1];
          }
        }

        var blockingId = undefined;

        // Insert blocking
        doxConnect({
          baseUrl: window.api_base_url,
          method: "post",
          async: false,
          path: "calendars/"+window.api_doxcal_id + "/events",
          data: params,
          username: window.api_username,
          password: window.api_password,
          success: function(data) {
            console.log("Created blocking:");
            console.log(data);
            blockingId = data.id;
          },
          error: function(data) {
            console.log(data);
          }
        });

        addBlockingIdToEvent(blocking_id, data.items[i]);

      }
    },
    error: function(data) {
      console.log(data);
    }
  });
  
  // Set last synced to now
  window.api_last_synced_gtod = (new Date()).getTime();
  localStorage.setItem("doxter-api-last-synced-gtod", window.api_last_synced_gtod);
}



// Sync bookings from Doxter to Google
function syncDoxterToGoogle() {

  var params = {
    "updated": new Date(parseInt(window.api_last_synced_dtog)).toISOString()
  }
        

  // Get bookings
  doxConnect({
    baseUrl: window.api_base_url,
    path: "calendars/"+window.api_doxcal_id + "/events?" + stringify(params),
    username: window.api_username,
    password: window.api_password,
    success: function(data) {
      var bookings = data;

      for(i = 0; i < bookings.length; i++) {
        console.log("Saving bookings from Doxter to Google:");
        console.log(bookings[i]);

        var url = "https://www.googleapis.com/calendar/v3/calendars/" + window.api_gcal_id + "/events";
        var params = {
          "start": {
            "dateTime": (new Date(bookings[i].starts)).toISOString()
          },
          "end": {
            "dateTime": (new Date(bookings[i].ends)).toISOString()
          },
          "summary": bookings[i].title,
          "description": bookings[i].reason + "\n\nDXID:"+bookings[i].id
        }
        
        // Insert event
        $.ajax({
          url: url,
          headers: {
            "Authorization": "OAuth " + window.access_token,
            "Content-Type": "application/json"
          },
          type: "post",
          dataType: "json",
          data: JSON.stringify(params),
          success: function(data) {
            console.log("Created event:");
            console.log(data);
          },
          error: function(data) {
            console.log(data);
          }
        });
      }
    } 
  });
  
  // Set last synced to now
  window.api_last_synced_dtog = (new Date()).getTime();
  localStorage.setItem("doxter-api-last-synced-dtog", window.api_last_synced_dtog);
}


// Update Google Calendar entry with Doxter-ID
function addBlockingIdToEvent(blocking_id, event_) {
  var url = "https://www.googleapis.com/calendar/v3/calendars/" + window.api_gcal_id + "/events/"+event_.id;
  var updateParams = {
    "start" : {
      "dateTime": (new Date(data.items[i].start)).toISOString()
    },
    "end" : {
      "dateTime": (new Date(data.items[i].end)).toISOString()
    },
    "description": (data.items[i].description ? data.items[i].description+"\n\n" : "") + "DXID:"+blocking_id
  }

  
  $.ajax({
    url: url,
    headers: {
      "Authorization": "OAuth " + window.access_token,
      "Content-Type": "application/json"
    },
    type: "post",
    dataType: "json",
    data: JSON.stringify(params),
    success: function(data) {
      console.log("Created event:");
      console.log(data);
    },
    error: function(data) {
      console.log(data);
    }
  });
}

// Used to refresh values after settings change
function refreshData() {
  getSettings();
}

