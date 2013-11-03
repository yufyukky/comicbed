import $ = require('jquery');
import mobile = require('jquerymobile');
import _ = require('underscore');
import Backbone = require('backbone');
import templates = require('templates');
import querystring = require('utils/querystring');
import BaseView = require('views/base');
import ComicJarView = require('views/comicjar');

export = ComicJarRouter;

class ComicJarRouter extends Backbone.Router {
  private routes: {[route:string]: string};
  private $el: JQuery;
  private currentView: BaseView;

  constructor() {
    this.routes = { '(?*querystring)': 'index', };
    this.currentView = null;
    super();
  }

  private index(query: string) {
    if (_.isEmpty(query)) { query = ''; }
    if (!_.isNull(this.currentView)) { this.currentView.close(); }

    var querydict = querystring.parse(query);
    this.currentView = new ComicJarView(templates.comicjar, querydict);
    $(document.body).html(this.currentView.render().el);
    $(document.body).trigger('create');
    mobile.changePage(this.currentView.$el, { reverse: false, changeHash: false });
  }
}
