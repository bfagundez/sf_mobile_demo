
// Backbone structure
var SFDemoApp = {}
SFDemoApp.DataCollection = Backbone.Collection.extend({});
SFDemoApp.ListItemView = Backbone.View.extend({
  tagName: 'li',
  attributes: {'class':'ui-li ui-li-static ui-btn-up-a ui-last-child'},
  initialize:function(){
    this.template = "<h3 class='ui-li-heading'><%= rec.get('Name') %></h3><p class='ui-li-desc'><strong>Phone: <%= rec.get('Phone') %></strong></p>";
  },
  render: function(){
    var $el = $(this.el);
    $el.html(_.template(this.template,{ 'rec' :this.model } ));
    return this;
  }
});

SFDemoApp.ListView = Backbone.View.extend({
  initialize: function(){
    this.el = this.options.el;
  },
  render: function(){

    var $el = $(this.el);
    self = this;

    this.collection.each(function(list) {
                         var item, sidebarItem;
                         item = new SFDemoApp.ListItemView({ model: list });
                         $el.append(item.render().el);
                      });

    return this;

  }
});

// cordova start event
document.addEventListener("deviceready", onDeviceReady, false);

function login(uname,pwd){

    $.mobile.loading( 'show', { text: 'Logging in...', textVisible: true, theme: 'a'});

    var login_done = $.Deferred();
    var api_contacted = $.Deferred();
    var got_identity = $.Deferred();
    var SESSION_ID = '';
    var url_assembled = 'https://mobileportal.secure.force.com/soapapi__login?u='+uname+'&p='+pwd;

    // Login step 1, usr and pwd against login url.
    $.ajax({
           url:url_assembled,
           dataType:'jsonp'
           }).done(function(res){
                   console.log('CALLOUT COMPLETED!')
                   console.log(res);
                   login_done.resolve(res);

                   }).fail(function(res){
                           navigator.notification.alert(
                                                        'There was an error contacting SF Portal',  // message
                                                        function(){},
                                                        'Exception found!',            // title
                                                        'OK'                  // buttonName
                                                        );
                           });

    // Login step 2 , get api status
    $.when(login_done).done(function(res){
                            console.log(api_contacted);
                            console.log('Login completed!',res.sessionId,res);
                            var sessionId = res.sessionId;
                            SESSION_ID = res.sessionId
                            // query for services
                            console.log('calling sf to get service endpoints')
                            $.ajax({
                                   url: 'https://na15.salesforce.com/services/data/v26.0/',
                                   beforeSend: function (request)
                                   {
                                   request.setRequestHeader("Authorization", 'Bearer '+sessionId );
                                   }, dataType: 'json'
                                   }).done(function(res){
                                           console.log(api_contacted);
                                           console.log('success',res);
                                           api_contacted.resolve(res);
                                           }).fail(function(res){
                                                   console.log('fail',res);
                                                   });

                            });


    // Final step , display accounts
    $.when(api_contacted).done(function(){
                               data = {}
                               data.q = 'Select Id, Name, Phone from Account';
                               $.ajax({
                                      url: 'https://na15.salesforce.com/services/data/v26.0/query/',
                                      data:data,
                                      dataType:'json',
                                      method: 'GET',
                                      beforeSend: function (request)
                                      {
                                      request.setRequestHeader("Authorization", 'Bearer '+SESSION_ID );
                                      }, dataType: 'json'
                                      }).done(function(res){
                                              console.log(res);
                                              console.log('success',res);
                                              var list = new SFDemoApp.ListView({collection:new SFDemoApp.DataCollection(res.records),el:$("#record_list")});
                                              console.log(list);
                                              list.render();
                                              $.mobile.changePage("#record_list_container", { 'transition' : 'flip'} );
                                              $.mobile.loading( 'hide' );
                                              }).fail(function(res){
                                                      console.log('fail',res);
                                                      });
                               });



}

function onDeviceReady() {
    // Now safe to use the Cordova API
    console.log("Cordova is ready!");

    $("#signup_form_submit").click(function(){

                                   $.mobile.loading( 'show', { text: 'Registering...', textVisible: true, theme: 'a'});

                                   var url_assembled = 'https://mobileportal.secure.force.com/soapapi__register?u='+$('#u_field').val()+'&e='+$('#e_field').val()+'&p='+$('#p_field').val();

                                   console.log('Calling this url:',url_assembled);
                                   $.ajax({
                                          url:url_assembled,
                                          dataType:'jsonp'
                                          }).done(function(res){
                                                  console.log('CALLOUT COMPLETED!')
                                                  console.log(res);

                                                  if(res.code == 200){
                                                  $.mobile.changePage("#start");
                                                  $.mobile.loading( 'hide' );
                                                  $.mobile.changePage("#registration_success", { 'role' : 'dialog' , 'transition' : 'pop'} );
                                                  $('#direct_login').click(function(){
                                                                           login($('#u_field').val(),$('#p_field').val());
                                                                           });

                                                  } else {
                                                  navigator.notification.alert(
                                                                               'There was an error creating the user, try again.',  // message
                                                                               function(){},
                                                                               'Exception found!',            // title
                                                                               'OK'                  // buttonName
                                                                               );
                                                  }

                                                  }).fail(function(res){
                                                          navigator.notification.alert(
                                                                                       'There was an error contacting SF Portal',  // message
                                                                                       function(){},
                                                                                       'Exception found!',            // title
                                                                                       'OK'                  // buttonName
                                                                                       );
                                                          });
                                   });


    $("#login_form_submit").click(function(){
      login($('#u_login_field').val(),$('#p_login_field').val());
    });
}





