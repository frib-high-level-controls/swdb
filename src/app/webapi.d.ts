/**
 * These type definition are shared by the client and server.
 */

// tslint:disable:no-namespace
declare namespace webapi {
  // Common 'package' for API requests and responses data.
  // Inspired by the following specifications (especially the Google style guide):
  //   http://labs.omniti.com/labs/jsend
  //   https://google.github.io/styleguide/jsoncstyleguide.xml
  export interface Pkg<T> {
    data: T;
    error?: PkgError;
  }

  export interface PkgError {
    // Numeric status code (ie HTTP status code).
    code: number;
    // Description of the error to display to the user.
    message: string;
    // Optional error details.
    errors?: PkgErrorDetail[];
  }

  export interface PkgErrorDetail {
    // Identifies the type of error (ie 'ValidationError').
    reason?: string;
    // Description of the error to display to the user.
    message: string;
    // The location of the error. (Indicates a portion
    // of the request data to which this error applies.)
    location: string;
  }

  // Application specific types defined below.
  export interface SWInstall {
    _id?: string;
    host?: string;
    name?: string;
    area?: string[];
    slots?: string[];
    status?: string;
    statusDate?: string;
    software?: string;
    vvResultsLoc?: string[];
    vvApprovalDate?: string;
    drrs?: string;
  }

  export type Inst = SWInstall

  export interface Software {
    _id?: string; // TODO: rename to 'id'?
    name: string;
    desc: string;
    branch: string;
    version: string;
    owner: string;
    engineer: string;
    levelOfCare: string;
    status: string;
    statusDate: string;
    platforms: string;
    descDocLoc: string;
    designDescDocLoc: string; // TODO: rename to 'desginDocLoc'?
    vvProcLoc: string[];
    vvResultsLoc: string[];
    versionControl: string;
    versionControlLoc: string;
    previous?: string;
    comment: string;
  }

  export type ISwdb = Software;
}
