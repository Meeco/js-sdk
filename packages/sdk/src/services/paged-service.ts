type NextPageSpec = string | undefined;
// The type in the API response is not the type in the input...
type NextPageSpecR = string | null;

interface IPagedResponse {
  next_page_after: NextPageSpecR;
  meta: object[];
}

function cleanInput(x: NextPageSpecR): NextPageSpec {
  return (x === null) ? undefined : x;
}

function resultHasNext(r: IPagedResponse): boolean {
  return r.meta.some(x => x['next_page_exists']);
}

export async function getAllPaged<T extends IPagedResponse>(apiMethod: (cursor: NextPageSpec) => Promise<T>): Promise<T[]> {

  const nextCall = (result: T[] = [], hasNext: boolean, cursor: NextPageSpec) => {
    if (hasNext) {
      return apiMethod(cursor).then(r => {
        result.push(r);
        // TODO errors: missing meta, meta there but no next_page_after
        return nextCall(result, resultHasNext(r), cleanInput(r.next_page_after));
      });
    } else {
      return Promise.resolve(result);
    }
  }

  return nextCall([], true, undefined);
}

export function* pagedToGenerator<T extends IPagedResponse>(apiMethod: (cursor: NextPageSpec) => Promise<T>): Generator<Promise<T>> {
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

function combinePages<T extends IPagedResponse>(a: T, b: T): T {
  const result: T = { ...a };

  Object.entries(result).forEach(([k, e]) => {
    if (e instanceof Array) {
      const r: unknown = e.concat(b[k]);
      result[k] = r;
    } else {
      result[k] = b[k];
    }
  });

  return result;
}

/**
 * Join responses by appending individual components.
 * Any non-array properties will have the value of the last response.
 */
export function reducePages<T extends IPagedResponse>(pages: T[]): T {
  return pages.reduce(combinePages);
}
