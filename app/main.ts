require(['config'], () => {
  require(['jquery'], ($: typeof $) => {

    $(document).bind("mobileinit", function(){
      $.mobile.ajaxEnabled = false;
      $.mobile.linkBindingEnabled = false;
      $.mobile.hashListeningEnabled = false;
      $.mobile.pushStateEnabled = false;
    });

    require(['jquerymobile'], (mobile: any) => {
      require([
        'backbone',
        'routers/router'
      ], (
        Backbone: typeof Backbone,
        ComicJarRouter: typeof ComicJarRouter
      ) => {
        var router = new ComicJarRouter();
        Backbone.history.start();
      });
    });
  });
});
