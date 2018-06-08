'use strict'; // necessary for es6 output in node

import { browser, element, by, ElementFinder, ElementArrayFinder } from 'protractor';
import { promise } from 'selenium-webdriver';

const expectedH1 = 'Tour of Books';
const expectedTitle = `${expectedH1}`;
const targetBook = { id: 15, name: 'Magneta' };
const targetBookDashboardIndex = 3;
const nameSuffix = 'X';
const newBookName = targetBook.name + nameSuffix;

class Book {
  id: number;
  name: string;

  // Factory methods

  // Book from string formatted as '<id> <name>'.
  static fromString(s: string): Book {
    return {
      id: +s.substr(0, s.indexOf(' ')),
      name: s.substr(s.indexOf(' ') + 1),
    };
  }

  // Book from book list <li> element.
  static async fromLi(li: ElementFinder): Promise<Book> {
      let stringsFromA = await li.all(by.css('a')).getText();
      let strings = stringsFromA[0].split(' ');
      return { id: +strings[0], name: strings[1] };
  }

  // Book id and name from the given detail element.
  static async fromDetail(detail: ElementFinder): Promise<Book> {
    // Get book id from the first <div>
    let _id = await detail.all(by.css('div')).first().getText();
    // Get name from the h2
    let _name = await detail.element(by.css('h2')).getText();
    return {
        id: +_id.substr(_id.indexOf(' ') + 1),
        name: _name.substr(0, _name.lastIndexOf(' '))
    };
  }
}

describe('Tutorial part 6', () => {

  beforeAll(() => browser.get(''));

  function getPageElts() {
    let navElts = element.all(by.css('app-root nav a'));

    return {
      navElts: navElts,

      appDashboardHref: navElts.get(0),
      appDashboard: element(by.css('app-root app-dashboard')),
      topBooks: element.all(by.css('app-root app-dashboard > div h4')),

      appBooksHref: navElts.get(1),
      appBooks: element(by.css('app-root app-books')),
      allBooks: element.all(by.css('app-root app-books li')),
      selectedBookSubview: element(by.css('app-root app-books > div:last-child')),

      bookDetail: element(by.css('app-root app-book-detail > div')),

      searchBox: element(by.css('#search-box')),
      searchResults: element.all(by.css('.search-result li'))
    };
  }

  describe('Initial page', () => {

    it(`has title '${expectedTitle}'`, () => {
      expect(browser.getTitle()).toEqual(expectedTitle);
    });

    it(`has h1 '${expectedH1}'`, () => {
        expectHeading(1, expectedH1);
    });

    const expectedViewNames = ['Dashboard', 'Books'];
    it(`has views ${expectedViewNames}`, () => {
      let viewNames = getPageElts().navElts.map((el: ElementFinder) => el.getText());
      expect(viewNames).toEqual(expectedViewNames);
    });

    it('has dashboard as the active view', () => {
      let page = getPageElts();
      expect(page.appDashboard.isPresent()).toBeTruthy();
    });

  });

  describe('Dashboard tests', () => {

    beforeAll(() => browser.get(''));

    it('has top books', () => {
      let page = getPageElts();
      expect(page.topBooks.count()).toEqual(4);
    });

    it(`selects and routes to ${targetBook.name} details`, dashboardSelectTargetBook);

    it(`updates book name (${newBookName}) in details view`, updateBookNameInDetailView);

    it(`cancels and shows ${targetBook.name} in Dashboard`, () => {
      element(by.buttonText('go back')).click();
      browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

      let targetBookElt = getPageElts().topBooks.get(targetBookDashboardIndex);
      expect(targetBookElt.getText()).toEqual(targetBook.name);
    });

    it(`selects and routes to ${targetBook.name} details`, dashboardSelectTargetBook);

    it(`updates book name (${newBookName}) in details view`, updateBookNameInDetailView);

    it(`saves and shows ${newBookName} in Dashboard`, () => {
      element(by.buttonText('save')).click();
      browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

      let targetBookElt = getPageElts().topBooks.get(targetBookDashboardIndex);
      expect(targetBookElt.getText()).toEqual(newBookName);
    });

  });

  describe('Books tests', () => {

    beforeAll(() => browser.get(''));

    it('can switch to Books view', () => {
      getPageElts().appBooksHref.click();
      let page = getPageElts();
      expect(page.appBooks.isPresent()).toBeTruthy();
      expect(page.allBooks.count()).toEqual(10, 'number of books');
    });

    it('can route to book details', async () => {
      getBookLiEltById(targetBook.id).click();

      let page = getPageElts();
      expect(page.bookDetail.isPresent()).toBeTruthy('shows book detail');
      let book = await Book.fromDetail(page.bookDetail);
      expect(book.id).toEqual(targetBook.id);
      expect(book.name).toEqual(targetBook.name.toUpperCase());
    });

    it(`updates book name (${newBookName}) in details view`, updateBookNameInDetailView);

    it(`shows ${newBookName} in Books list`, () => {
      element(by.buttonText('save')).click();
      browser.waitForAngular();
      let expectedText = `${targetBook.id} ${newBookName}`;
      expect(getBookAEltById(targetBook.id).getText()).toEqual(expectedText);
    });

    it(`deletes ${newBookName} from Books list`, async () => {
      const booksBefore = await toBookArray(getPageElts().allBooks);
      const li = getBookLiEltById(targetBook.id);
      li.element(by.buttonText('x')).click();

      const page = getPageElts();
      expect(page.appBooks.isPresent()).toBeTruthy();
      expect(page.allBooks.count()).toEqual(9, 'number of books');
      const booksAfter = await toBookArray(page.allBooks);
      // console.log(await Book.fromLi(page.allBooks[0]));
      const expectedBooks =  booksBefore.filter(h => h.name !== newBookName);
      expect(booksAfter).toEqual(expectedBooks);
      // expect(page.selectedBookSubview.isPresent()).toBeFalsy();
    });

    it(`adds back ${targetBook.name}`, async () => {
      const newBookName = 'Alice';
      const booksBefore = await toBookArray(getPageElts().allBooks);
      const numBooks = booksBefore.length;

      element(by.css('input')).sendKeys(newBookName);
      element(by.buttonText('add')).click();

      let page = getPageElts();
      let booksAfter = await toBookArray(page.allBooks);
      expect(booksAfter.length).toEqual(numBooks + 1, 'number of books');

      expect(booksAfter.slice(0, numBooks)).toEqual(booksBefore, 'Old books are still there');

      const maxId = booksBefore[booksBefore.length - 1].id;
      expect(booksAfter[numBooks]).toEqual({id: maxId + 1, name: newBookName});
    });

    it('displays correctly styled buttons', async () => {
      element.all(by.buttonText('x')).then(buttons => {
        for (const button of buttons) {
          // Inherited styles from styles.css
          expect(button.getCssValue('font-family')).toBe('Arial');
          expect(button.getCssValue('border')).toContain('none');
          expect(button.getCssValue('padding')).toBe('5px 10px');
          expect(button.getCssValue('border-radius')).toBe('4px');
          // Styles defined in books.component.css
          expect(button.getCssValue('left')).toBe('194px');
          expect(button.getCssValue('top')).toBe('-32px');
        }
      });

      const addButton = element(by.buttonText('add'));
      // Inherited styles from styles.css
      expect(addButton.getCssValue('font-family')).toBe('Arial');
      expect(addButton.getCssValue('border')).toContain('none');
      expect(addButton.getCssValue('padding')).toBe('5px 10px');
      expect(addButton.getCssValue('border-radius')).toBe('4px');
    });

  });

  describe('Progressive book search', () => {

    beforeAll(() => browser.get(''));

    it(`searches for 'Ma'`, async () => {
      getPageElts().searchBox.sendKeys('Ma');
      browser.sleep(1000);

      expect(getPageElts().searchResults.count()).toBe(4);
    });

    it(`continues search with 'g'`, async () => {
      getPageElts().searchBox.sendKeys('g');
      browser.sleep(1000);
      expect(getPageElts().searchResults.count()).toBe(2);
    });

    it(`continues search with 'n' and gets ${targetBook.name}`, async () => {
      getPageElts().searchBox.sendKeys('n');
      browser.sleep(1000);
      let page = getPageElts();
      expect(page.searchResults.count()).toBe(1);
      let book = page.searchResults.get(0);
      expect(book.getText()).toEqual(targetBook.name);
    });

    it(`navigates to ${targetBook.name} details view`, async () => {
      let book = getPageElts().searchResults.get(0);
      expect(book.getText()).toEqual(targetBook.name);
      book.click();

      let page = getPageElts();
      expect(page.bookDetail.isPresent()).toBeTruthy('shows book detail');
      let book2 = await Book.fromDetail(page.bookDetail);
      expect(book2.id).toEqual(targetBook.id);
      expect(book2.name).toEqual(targetBook.name.toUpperCase());
    });
  });

  async function dashboardSelectTargetBook() {
    let targetBookElt = getPageElts().topBooks.get(targetBookDashboardIndex);
    expect(targetBookElt.getText()).toEqual(targetBook.name);
    targetBookElt.click();
    browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

    let page = getPageElts();
    expect(page.bookDetail.isPresent()).toBeTruthy('shows book detail');
    let book = await Book.fromDetail(page.bookDetail);
    expect(book.id).toEqual(targetBook.id);
    expect(book.name).toEqual(targetBook.name.toUpperCase());
  }

  async function updateBookNameInDetailView() {
    // Assumes that the current view is the book details view.
    addToBookName(nameSuffix);

    let page = getPageElts();
    let book = await Book.fromDetail(page.bookDetail);
    expect(book.id).toEqual(targetBook.id);
    expect(book.name).toEqual(newBookName.toUpperCase());
  }

});

function addToBookName(text: string): promise.Promise<void> {
  let input = element(by.css('input'));
  return input.sendKeys(text);
}

function expectHeading(hLevel: number, expectedText: string): void {
    let hTag = `h${hLevel}`;
    let hText = element(by.css(hTag)).getText();
    expect(hText).toEqual(expectedText, hTag);
};

function getBookAEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('..'));
}

function getBookLiEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('../..'));
}

async function toBookArray(allBooks: ElementArrayFinder): Promise<Book[]> {
  let promisedBooks = await allBooks.map(Book.fromLi);
  // The cast is necessary to get around issuing with the signature of Promise.all()
  return <Promise<any>> Promise.all(promisedBooks);
}
