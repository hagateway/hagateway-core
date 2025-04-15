export interface APIDataResponseBody extends Record<string, any> {
    type: "data";
}

export interface APIErrorResponseBody extends Record<string, any> {
    type: "error";
    message: string;
}

export type APIResponseBody = APIDataResponseBody | APIErrorResponseBody | null;
