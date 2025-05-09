import { keystoneFetch } from '@/app/api/graphql/keystone'

export type SpeechFromRes = {
  slug: string
  date: string
  title: string
  legislativeYuanMember: {
    legislator: {
      name: string
      slug: string
    }
  }
  attendee?: string
  topics?: {
    title: string
    slug: string
  }[]
  summary?: string
  content?: string
  ivodLink?: string
  ivodStartTime?: string
}

/** fetchSpeech
 *  fetch speech with given slug
 */
export const fetchSpeech = async ({
  slug,
}: {
  slug: string
}): Promise<SpeechFromRes | undefined> => {
  const where = {
    slug,
  }

  const query = `
    query Speech($where: SpeechWhereUniqueInput!) {
      speech(where: $where) {
        slug
        date
        title
        legislativeYuanMember {
          legislator {
            name
            slug
          }
        }
        attendee
        topics {
          title
          slug
        }
        summary
        content
        ivodLink
      }
    }
  `

  const variables = { where }

  try {
    const data = await keystoneFetch<{
      speech?: SpeechFromRes
    }>(JSON.stringify({ query, variables }), false)
    if (data.errors) {
      throw new Error(JSON.stringify(data.errors))
    }
    return data?.data?.speech
  } catch (error) {
    throw new Error(`Failed to fetch speech for slug: ${slug}, err: ${error}`)
  }
}

/**
 * fetchSpeechGroup
 *  fetch speech group by given title and date
 */
export const fetchSpeechGroup = async ({
  title,
  date,
}: {
  title: string
  date: string
}): Promise<string[]> => {
  const where = {
    title: { equals: title },
    date: { equals: date },
  }
  const orderBy = [{ ivodStartTime: 'asc' }]

  const query = `
    query Speeches($where: SpeechWhereInput!, $orderBy: [SpeechOrderByInput!]!) {
      speeches(where: $where, orderBy: $orderBy) {
        slug
        ivodStartTime
      }
    }
  `

  const variables = { where, orderBy }

  try {
    const data = await keystoneFetch<{
      speeches?: { slug: string; ivodStartTime?: string }[]
    }>(JSON.stringify({ query, variables }), false)
    if (data.errors) {
      throw new Error(JSON.stringify(data.errors))
    }
    const slugs = data?.data?.speeches?.map((speech) => speech.slug) ?? []
    return slugs
  } catch (error) {
    throw new Error(
      `Failed to fetch speech group for title: ${title}, date: ${date}, err: ${error}`
    )
  }
}
