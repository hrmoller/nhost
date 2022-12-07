import fetch from 'cross-fetch'
import { DocumentNode, print } from 'graphql'
import { urlFromSubdomain } from '../utils/helpers'
import { GraphqlRequestResponse, NhostClientConstructorParams } from '../utils/types'

export interface NhostGraphqlConstructorParams {
  /**
   * GraphQL endpoint.
   */
  url: string
  /**
   * Admin secret. When set, it is sent as an `x-hasura-admin-secret` header for all requests.
   */
  adminSecret?: string
}

/**
 * Creates a client for GraphQL from either a subdomain or a URL
 */
export function createGraphqlClient(params: NhostClientConstructorParams) {
  const graphqlUrl =
    'subdomain' in params || 'backendUrl' in params
      ? urlFromSubdomain(params, 'graphql')
      : params.graphqlUrl

  if (!graphqlUrl) {
    throw new Error('Please provide `subdomain` or `graphqlUrl`.')
  }

  return new NhostGraphqlClient({ url: graphqlUrl, ...params })
}

/**
 * @alias GraphQL
 */
export class NhostGraphqlClient {
  readonly url: string
  private accessToken: string | null
  private adminSecret?: string

  constructor(params: NhostGraphqlConstructorParams) {
    const { url, adminSecret } = params

    this.url = url
    this.accessToken = null
    this.adminSecret = adminSecret
  }

  /**
   * Use `nhost.graphql.request` to send a GraphQL request. For more serious GraphQL usage we recommend using a GraphQL client such as Apollo Client (https://www.apollographql.com/docs/react).
   *
   * @example
   * ```ts
   * const CUSTOMERS = gql`
   *  query {
   *   customers {
   *    id
   *    name
   *  }
   * }
   * `
   * const { data, error } = await nhost.graphql.request(CUSTOMERS)
   * ```
   *
   * @docs https://docs.nhost.io/reference/javascript/nhost-js/graphql/request
   */
  async request<T = any, V = any>(
    document: string | DocumentNode,
    variables?: V,
    config: RequestInit = {}
  ): Promise<GraphqlRequestResponse<T>> {
    const { headers, ...rest } = config
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        body: JSON.stringify({
          query: typeof document === 'string' ? document : print(document),
          variables
        }),
        headers: {
          'Content-Type': 'application/json',
          ...this.generateAccessTokenHeaders(),
          ...headers
        },
        ...rest
      })
      if (!response.ok) {
        return {
          data: null,
          error: new Error(response.statusText)
        }
      }
      const { data, errors } = await response.json()

      if (errors) {
        return {
          data: null,
          error: errors
        }
      }
      if (typeof data !== 'object' || Array.isArray(data) || data === null) {
        return {
          data: null,
          error: new Error('incorrect response data from GraphQL server')
        }
      }

      return { data, error: null }
    } catch (e) {
      return { data: null, error: e as Error }
    }
  }

  /**
   * Use `nhost.graphql.getUrl` to get the GraphQL URL.
   *
   * @example
   * ```ts
   * const url = nhost.graphql.getUrl();
   * ```
   *
   * @docs https://docs.nhost.io/reference/javascript/nhost-js/graphql/get-url
   */
  getUrl(): string {
    return this.url
  }

  /**
   * Use `nhost.graphql.setAccessToken` to a set an access token to be used in subsequent graphql requests. Note that if you're signin in users with `nhost.auth.signIn()` the access token will be set automatically.
   *
   * @example
   * ```ts
   * nhost.graphql.setAccessToken('some-access-token')
   * ```
   *
   * @docs https://docs.nhost.io/reference/javascript/nhost-js/graphql/set-access-token
   */
  setAccessToken(accessToken: string | undefined) {
    if (!accessToken) {
      this.accessToken = null
      return
    }

    this.accessToken = accessToken
  }

  private generateAccessTokenHeaders(): HeadersInit {
    if (this.adminSecret) {
      return {
        'x-hasura-admin-secret': this.adminSecret
      }
    }
    if (this.accessToken) {
      return {
        Authorization: `Bearer ${this.accessToken}`
      }
    }
    return {}
  }
}
