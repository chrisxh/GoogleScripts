/////////////////////////////////////////////////////////////////////////
///Goal - move archives of test@googlegroups.com into list@mydomain.org
///How?  
///    - examine contents of current user's mailbox, 
///    - find messages sent to source group
///    - for each, copy as a new message into the target group
///
///https://developers.google.com/admin-sdk/groups-migration/v1/guides/manage-email-migrations
///https://developers.google.com/apps-script/reference/gmail/gmail-thread#getMessages()
/////////////////////////////
function main(){
  var startDate = "8/12/2018";
  var endDate = "8/31/2018";
  var daysPerIteration = 5;
  var sourceGroup = "test@googlegroups.com";
  var destinationGroup = "list@mydomain.org";
  
  Logger.clear();
  
  var s = new Date(startDate);
  while(s < new Date(endDate)){
    var e = addDays(s,daysPerIteration);
    
    addMessagesToGroup(sourceGroup, "[maspa/sn]",  destinationGroup, fmt(s), fmt(e));
    
    s = addDays(e,1);
  }
}

/////////////////////////////
///Format date as yyyy/mm/dd to 
///comply with GMail search
/////////////////////////////
function fmt(g){
  return g.getFullYear() + '/' + (g.getMonth() < 9 ? "0": "") + (g.getMonth() + 1) + '/' + (g.getDate() < 10 ? "0": "") + g.getDate();
}


/////////////////////////////
///Add x days to a Date
/////////////////////////////
function addDays(theDate, days) {
    return new Date(theDate.getTime() + days*24*60*60*1000);
}


/////////////////////////////
///Perform the work to generate topics in target group
///based on messages found in user's mailbox.
/////////////////////////////
function addMessagesToGroup(sourceGroup, sourceMessagePrefix, destinationGroup, startDate, endDate) {
  var groupId = destinationGroup;
  
  var threadBatchSize = 10;//number of message threads to query from api
  var insertBatchSize = 10; //number of message threads to insert before pausing (to avoid quota limits)
  
  for(var i = 0; i < 100; i++)
  {
    Logger.log('Search for result set between %s and %s, items %s to %s', startDate, endDate, i*threadBatchSize, i*threadBatchSize + threadBatchSize);
    
    
    var threads = GmailApp.search('subject:("' + sourceMessagePrefix + '") to:' + sourceGroup + ' after:' + startDate + ' before:' + endDate + '', i*threadBatchSize, threadBatchSize);
            
    if (!threads || threads.length == 0) {
      Logger.log('No (more) threads in search. Returning');
      return;
    }
        
    for(var j = 0; j < threads.length;j++)
    {
      var thread = threads[j];   
      
      if(thread){
        var messages = thread.getMessages();
        
        if(messages && messages.length > 0){  
          
          for(var l=0;l < messages.length;l++){
            
            for(var m = 0; m < insertBatchSize && l+ m < messages.length; m++){
              var message = messages[l+m];
              var from = message.getFrom();
              var tom = message.getTo();
              
              if(tom != "me@mydomain.org"){//Don't include messages I've sent to group
                var content = message.getRawContent();
                var contentBlob = Utilities.newBlob(content, 'message/rfc822');
                try{
                  var response = AdminGroupsMigration.Archive.insert(groupId, contentBlob);
                  Logger.log('Message %s "%s" Response code: %s', i+j+l+m, message.getSubject(), response.responseCode);
                }
                catch(ex){
                  Logger.log('ERROR %s', ex);
                }
              }
              
            }
            //pause a second after inserting 10 so as to not surpass quota
            Utilities.sleep(1000);
            l += insertBatchSize;
          }                                   
          
        }
      }
      
    }
  }
  Logger.log('Complete');
}
