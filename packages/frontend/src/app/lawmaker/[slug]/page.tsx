import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
// fetchers
import {
  checkLegislatorExist,
  fetchLegislator,
  fetchLegislatorTopics,
  getLegislatorMeetingTerms,
} from '@/fetchers/server/legislator'
// components
import LegislatorPage from '@/components/legislator'
// utils
import { validateMeetingParams } from '@/utils/validate-meeting-params'

export const dynamicParams = true

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ meetingTerm?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { meetingTerm } = await searchParams

  const isLegislatorExist = await checkLegislatorExist({ slug })
  if (!isLegislatorExist) {
    notFound()
  }
  const meetingTerms = await getLegislatorMeetingTerms({ slug })
  const chosenMeetingTerm =
    meetingTerm && meetingTerms.includes(meetingTerm)
      ? meetingTerm
      : meetingTerms[0]

  const data = await fetchLegislator({
    slug,
    legislativeMeeting: Number(chosenMeetingTerm),
  })

  return {
    title: `委員 – ${data?.legislator.name}`,
    description: `委員 ${data?.legislator.name} 的發言紀錄`,
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ meetingTerm?: string; sessionTerm?: string }>
}) {
  try {
    const { slug } = await params
    const { meetingTerm, sessionTerm } = await searchParams
    const meetingTerms = await getLegislatorMeetingTerms({ slug })

    const chosenMeetingTerm =
      meetingTerm && meetingTerms.includes(meetingTerm)
        ? meetingTerm
        : meetingTerms[0]

    const { legislativeMeeting, legislativeMeetingSession } =
      await validateMeetingParams(chosenMeetingTerm, sessionTerm)

    const [legislatorData, topicsData] = await Promise.all([
      fetchLegislator({ slug, legislativeMeeting }),
      fetchLegislatorTopics({
        slug,
        legislativeMeetingTerm: legislativeMeeting,
        legislativeMeetingSessionTerms: legislativeMeetingSession,
      }),
    ])

    if (!legislatorData) notFound()

    return (
      <LegislatorPage
        legislatorData={legislatorData}
        topicsData={topicsData}
        currentMeetingTerm={legislativeMeeting}
        currentMeetingSession={legislativeMeetingSession}
      />
    )
  } catch (error) {
    console.error('Error fetching legislator data:', error)
    return <div>Failed to load legislator data. Please try again later.</div>
  }
}
