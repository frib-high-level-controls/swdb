/*
 * Mock FORG API Client with in-memory user store.
 */
import * as forgapi from '../../app/shared/forgapi';

export type User = forgapi.User;

export class MockClient implements forgapi.IClient {

  public static getInstance(): MockClient {
    if (MockClient.instance) {
      return MockClient.instance;
    }
    MockClient.instance = new MockClient();
    return MockClient.instance;
  };

  protected static instance: MockClient | undefined;

  public users = new Map<string, User>();

  public addUser(user: User | User[]) {
    if (Array.isArray(user)) {
      for (let u of user) {
        this.addUser(u);
      }
    } else {
      if (user.uid) {
        user.uid = user.uid.toUpperCase();
        this.users.set(user.uid, user);
      }
    }
  };

  public removeUser(user: string | string[]) {
    if (Array.isArray(user)) {
      for (let u of user) {
        this.removeUser(u);
      }
    } else {
      this.users.delete(user.toUpperCase());
    }
  };

  public findUser(uid: string): Promise<User | undefined> {
    const user = this.users.get(uid.toUpperCase());
    if (!user) {
      return Promise.resolve(undefined);
    }
    return Promise.resolve(user);
  };

  public findUsers(): Promise<User[]> {
    return Promise.resolve(Array.from(this.users.values()));
  };
}
