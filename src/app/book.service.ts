import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';

import { Book } from './book';
import { MessageService } from './message.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable()
export class BookService {

  private booksUrl = 'api/books';  // URL to web api

  constructor(
    private http: HttpClient,
    private messageService: MessageService) { }

  getBooks (): Observable<Book[]> {
    return this.http.get<Book[]>(this.booksUrl)
      .pipe(
        tap(books => this.log(`fetched books`)),
        catchError(this.handleError('getBooks', []))
      );
  }

  /** GET book by id. Return `undefined` when id not found */
  getBookNo404<Data>(id: number): Observable<Book> {
    const url = `${this.booksUrl}/?id=${id}`;
    return this.http.get<Book[]>(url)
      .pipe(
        map(books => books[0]), // returns a {0|1} element array
        tap(h => {
          const outcome = h ? `fetched` : `did not find`;
          this.log(`${outcome} book id=${id}`);
        }),
        catchError(this.handleError<Book>(`getBook id=${id}`))
      );
  }

  /** GET book by id. Will 404 if id not found */
  getBook(id: number): Observable<Book> {
    const url = `${this.booksUrl}/${id}`;
    return this.http.get<Book>(url)
      .pipe(
        tap(_ => this.log(`fetched book id=${id}`)),
      catchError(this.handleError<Book>(`getBook id=${id}`))
    );
  }

   /* GET books whose name contains search term */
   searchBooks(term: string): Observable<Book[]> {
    if (!term.trim()) {
      // if not search term, return empty book array.
      return of([]);
     }
     return this.http.get<Book[]>(`${this.booksUrl}/?name=${term}`).pipe(
       tap(_ => this.log(`found Bookes matching "${term}"`)),
       catchError(this.handleError<Book[]>('searchBookes', []))
     );
  }

  //////// Save methods //////////

  /** POST: add a new book to the server */
  addBook (book: Book): Observable<Book> {
    return this.http.post<Book>(this.booksUrl, book, httpOptions).pipe(
      tap((book: Book) => this.log(`added hero w/ id=${book.id}`)),
      catchError(this.handleError<Book>('addBook'))
    );
  }

  /** DELETE: delete the book from the server */
  deleteBook (book: Book | number): Observable<Book> {
    const id = typeof book === 'number' ? book : book.id;
    const url = `${this.booksUrl}/${id}`;

    return this.http.delete<Book>(url, httpOptions).pipe(
      tap(_ => this.log(`deleted Book id=${id}`)),
      catchError(this.handleError<Book>('deleteBook'))
    );
  }

  /** PUT: update the book on the server */
  updateBook (book: Book): Observable<any> {
    return this.http.put(this.booksUrl, book, httpOptions).pipe(
      tap(_ => this.log(`updated book id=${book.id}`)),
      catchError(this.handleError<any>('updateBook'))
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a BookService message with the MessageService */
  private log(message: string) {
    this.messageService.add('BookService: ' + message);
  }
}
