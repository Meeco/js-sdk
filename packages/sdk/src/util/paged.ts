import { SimpleLogger } from '../util/logger';

type NextPageSpec = string | undefined;
type NextPageSpecR = string | null;

interface IPagedResponse {
  next_page_after: NextPageSpecR;
  meta: object;
}

// The type in the API response is not the type in the input...
function cleanInput(x: NextPageSpecR): NextPageSpec {
  return x === null ? undefined : x;
}

export function resultHasNext(r: IPagedResponse): boolean {
  const pageExists: boolean = r.meta['next_page_exists'] || !!r.next_page_after;
  if (pageExists && !r.next_page_after) {
    // Expect this error on API update or bad test cases.
    throw new Error(
      'Badly formatted response: expected more pages, but property `next_page_after` was not specified'
    );
  }
  return pageExists;
}

/**
 * Sequentially get all pages in this collection.
 * This may take a long time, as the cursor is not known until the current query has finished.
 * If you want to stop partway, use `pagedToGenerator`.
 * If the response is an object of arrays, use `reducePages` to flatten the result.
 * @param apiMethod Partially applied API method to collect pages from.
 */
export async function getAllPaged<T extends IPagedResponse>(
  apiMethod: (cursor: NextPageSpec) => Promise<T>
): Promise<T[]> {
  // Recursion: collect results and pass new cursor position
  const nextCall = (result: T[] = [], hasNext: boolean, cursor: NextPageSpec) => {
    if (hasNext) {
      return apiMethod(cursor).then(r => {
        result.push(r);
        return nextCall(result, resultHasNext(r), cleanInput(r.next_page_after));
      });
    } else {
      return result;
    }
  };

  // Base case: we don't know the cursor until after the first API call
  return nextCall([], true, undefined);
}

/**
 * Returns all API calls required to visit all pages in this collection.
 * Use this if you need to process the individual responses before proceeding
 * with the query, e.g. when searching.
 * @param apiMethod Partially applied API method to collect pages from.
 */
export function* pagedToGenerator<T extends IPagedResponse>(
  apiMethod: (cursor: NextPageSpec) => Promise<T>
): Generator<Promise<T>> {
  let hasNext = true;
  let cursor: NextPageSpec;

  while (hasNext) {
    yield apiMethod(cursor).then(r => {
      hasNext = resultHasNext(r);
      cursor = cleanInput(r.next_page_after);
      return r;
    });
  }
}

/**
 * Merge all Array properties of a and b, except for 'meta' property.
 * For any primitive types and the meta property, take the last one.
 * Throw an Error for any Object properties when checkObjects is not set.
 * @param checkObjects
 * @param a
 * @param b
 */
function combinePages<T extends {}>(checkObjects: boolean) {
  return (a: T, b: T) => {
    const result: T = { ...a };

    Object.entries(result).forEach(([k, e]) => {
      if (e instanceof Array) {
        if (k === 'meta') {
          result[k] = b[k];
        } else {
          result[k] = e.concat(b[k]);
        }
      } else if (e && checkObjects && typeof e === 'object') {
        throw new Error(
          'Combining paged results for object-valued property "' + k + '" is probably an error'
        );
      } else {
        result[k] = b[k];
      }
    });

    return result;
  };
}

/**
 * Join responses by appending individual components.
 * Any object-valued properties with raise an error.
 * Primitive-typed properties will take the last value.
 */
export function reducePages<T extends {}>(pages: T[]): T {
  return pages.reduce(combinePages(true));
}

/**
 * Join responses by appending individual components.
 * Any non-array properties will have the value of the last response.
 */
export function reducePagesTakeLast<T extends {}>(pages: T[]): T {
  return pages.reduce(combinePages(false));
}

export function reportIfTruncated<T extends IPagedResponse>(log: SimpleLogger) {
  return (pagedResult: T) => {
    if (resultHasNext(pagedResult)) {
      log('Some results omitted');
    }
    return pagedResult;
  };
}
