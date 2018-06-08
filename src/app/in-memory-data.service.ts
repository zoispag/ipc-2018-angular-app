import { InMemoryDbService } from 'angular-in-memory-web-api';

export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const books = [
      { id: 11, name: 'Using React and Redux' },
      { id: 12, name: 'Angular in Action' },
      { id: 13, name: 'NativeScript in Action' },
      { id: 14, name: 'Vuejs in Action' },
      { id: 15, name: 'Magneta' },
      { id: 16, name: 'Learning React Native' },
      { id: 17, name: 'Functional programming' },
      { id: 18, name: 'Manetron' },
      { id: 19, name: 'Marafon' },
      { id: 20, name: 'Magetron' },
    ];
    return {books};
  }
}
