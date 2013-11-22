head.scriptPath = '../scripts';

head.load(head.makePaths(['lib/jquery', 'doxter']), function() {
  $(function() {
    Doxter = window.Doxter;
    Doxter.backgroundPage = chrome.extension.getBackgroundPage();

    $("#save").click(function() {
      Doxter.saveSettings(true);
      Doxter.notifyUser("doxter Chrome", "Erfolgreich gespeichert!", "success48.png");
      if(!Doxter.backgroundPage.startedSyncing) {
        Doxter.backgroundPage.Doxter.start();
      }
    });

    $("#fetch-calendars").click(function() {
      Doxter.fetchCalendars(); 
    });

    // Get credentials from local storage
    Doxter.fetchSettings();
    Doxter.fillInValues();

    if(Doxter.Settings.calendarIds) {
      Doxter.insertDropdownForCalendarIds();
    }
    else {
      $("#doxcal-id").val("placeholder");
    }
  }); // $(function(){})
}); // require

