import $ = require('jquery');
import Events = require('models/events');
import Screen = require('models/screen');
import Screens = require('collections/screens');
import Book = require('models/book');

export = Reader;

module Reader {
  export enum Status { Closed, Opening, Opened, Error }

  export interface Reader extends Events.Events {
    // open/close
    openURL(url: string): JQueryPromise<Reader>;
    close(): void;
    // properties
    status(): Status;
    currentPageNum(): number;
    totalPageNum(): number;
    readingDirection(): Screen.ReadingDirection;
    // move
    goNextScreen(): void;
    goPrevScreen(): void;
    goToPage(pageNum: number): void;
    // other
    screens(): Screens.Screens;
    resize(width: number, height: number): void;
  }

  export function create(bookFactory: Book.Factory, screens: Screens.Screens): Reader {
    return new ReaderModel(bookFactory, screens);
  }

  export interface ScreenMover {
    goNextScreen(): void;
    goPrevScreen(): void;
  }
}

class ReaderModel extends Backbone.Model implements Reader.Reader {
  // immultable members
  private _bookFactory: Book.Factory;
  private _screens: Screens.Screens;
  // mutable members
  private _book: Book.Book;
  private _deferred: JQueryDeferred<Reader.Reader>;

  // ctor & initializer (TODO);
  constructor(bookFactory: Book.Factory, screens: Screens.Screens) {
    this._bookFactory = bookFactory;
    this._screens = screens;
    this._book = null;
    this._deferred = $.Deferred<Reader.Reader>().reject();
    super();
  }

  initialize() { }

  // properties
  //// defaults
  defaults() {
    return {
      status: Reader.Status.Closed,
      currentPageNum: 0,
      totalPageNum: 0,
      readingDirection: Screen.ReadingDirection.Forward,
    };
  }
  //// getter
  status(): Reader.Status { return <Reader.Status>this.get('status'); }
  currentPageNum(): number { return <number>this.get('currentPageNum'); }
  totalPageNum(): number { return <number>this.get('totalPageNum'); }
  readingDirection(): Screen.ReadingDirection {
    return <Screen.ReadingDirection>this.get('readingDirection');
  }
  //// setter
  setStatus(status: Reader.Status) { this.set('status', status); }
  setCurrentPageNum(currentPageNum: number) { this.set('currentPageNum', currentPageNum); }
  setTotalPageNum(totalPageNum: number) { this.set('totalPageNum', totalPageNum); }
  setReadingDirection(readingDirection: Screen.ReadingDirection) {
    this.set('readingDirection', readingDirection);
  }

  // open/close;
  openURL(url: string): JQueryPromise<Reader.Reader> {
    this.close();
    this.setStatus(Reader.Status.Opening);
    this._deferred = $.Deferred<Reader.Reader>();
    this._bookFactory.createFromURL(url).then((book: Book.Book) => {
      this._book = book;
      this.resetReadingInfo();
      this.goToPage(this.currentPageNum());
      this.setStatus(Reader.Status.Opened);
      this._deferred.resolve(this);
    }).fail(() => {
      this.setStatus(Reader.Status.Error);
      this._deferred.reject();
    });
    return this._deferred.promise();
  }
  close(): void {
    this._book = null;
    if (this._deferred !== null) {
      this._deferred.reject();
    }
    this.setStatus(Reader.Status.Closed);
  }

  // move
  goNextScreen(): void {
    var newPageNum = this.currentPageNum() + 1;
    if (this.readingDirection() === Screen.ReadingDirection.Forward) {
      var displayedPageNum = this._screens.currentScreen().pages().length;
      newPageNum = this.currentPageNum() + displayedPageNum;
    }
    if (!this.isValidPageNum(newPageNum)) {
      return;
    }
    this.update(newPageNum, Screen.ReadingDirection.Forward);
  }

  goPrevScreen(): void {
    var newPageNum = this.currentPageNum() - 1;
    if (this.readingDirection() === Screen.ReadingDirection.Backward) {
      var displayedPageNum = this._screens.currentScreen().pages().length;
      newPageNum = this.currentPageNum() - displayedPageNum;
    }
    if (!this.isValidPageNum(newPageNum)) {
      return;
    }
    this.update(newPageNum, Screen.ReadingDirection.Backward);
  }

  goToPage(pageNum: number): void {
    var pages = this._book.pages();
    if (!this.isValidPageNum(pageNum)) {
      return;
    }
    this.update(pageNum, Screen.ReadingDirection.Forward);
  }

  // other
  screens(): Screens.Screens { return this._screens; }
  resize(width: number, height: number): void { this._screens.resize(width, height); }

  // private
  private update(pageNum: number, direction: Screen.ReadingDirection) {
    this._screens.update(this._book.pages(), {
      currentPageNum: pageNum,
      readingDirection: direction,
    });
    this.setCurrentPageNum(pageNum);
    this.setReadingDirection(direction);
  }

  private isValidPageNum(pageNum: number): boolean {
    var pages = this._book.pages();
    return 0 <= pageNum && pageNum < pages.length;
  }

  private resetReadingInfo(): void {
    this.setCurrentPageNum(0);
    this.setTotalPageNum(this._book.pages().length);
    this.setReadingDirection(Screen.ReadingDirection.Forward);
  }
}
