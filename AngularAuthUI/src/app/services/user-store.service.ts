import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserStoreService {
  private fullName$ = new BehaviorSubject<string>(''); // BehaviorSubject is a type of Subject, a special type of Observable that allows values to be multicasted to many Observers. Subjects are like EventEmitters: they maintain a registry of many listeners.
  private role$ = new BehaviorSubject<string>(''); // $ is a convention that indicates that the variable is an Observable.
                  // Observable it's a stream of data that can be processed using operators.
  constructor() { }

  public getRoleFromStore(){
    return this.role$.asObservable();
  }

  public setRoleInStore(role: string){
    this.role$.next(role);  // next() is a method that allows you to push a new value to the Observable.
  }

  public getFullNameFromStore(){
    return this.fullName$.asObservable();
  }

  public setFullNameInStore(fullName: string){
    this.fullName$.next(fullName);
  }
}
