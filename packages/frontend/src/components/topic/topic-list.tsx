'use client'
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import useSWR from 'swr'
import Link from 'next/link'
// @twreporter
import {
  colorGrayscale,
  colorOpacity,
} from '@twreporter/core/lib/constants/color'
import mq from '@twreporter/core/lib/utils/media-query'
// Common components
import {
  Container,
  Title,
  Body,
  SummarySection,
  EmptyState,
  EmptyStateText,
} from '@/components/layout/speech-summary-list/layout'
import TabNavigation from '@/components/layout/speech-summary-list/tab-navigation'
import FollowMoreItems from '@/components/layout/speech-summary-list/follow-more-items'
//  components
import { groupSummary } from '@/components/sidebar'
import CardsOfTheYear, {
  type SummaryCardProps,
  type CardsOfTheYearProps,
} from '@/components/sidebar/card'
import { Issue, type IssueProps } from '@/components/sidebar/follow-more'
import { Loader } from '@/components/loader'
import FilterModal from '@/components/sidebar/filter-modal'
// types
import type { TabProps } from '@/components/sidebar/type'
// constants
import { InternalRoutes } from '@/constants/routes'
// fetcher
import { fetchTopTopicsForLegislator } from '@/fetchers/topic'
import { type SpeechData } from '@/fetchers/server/topic'
// z-index
import { ZIndex } from '@/styles/z-index'

const maxTabs = 5
const mapToTabItems = (items: LegislatorData[]): TabProps[] =>
  items.map((legislator) => ({ ...legislator, showAvatar: true }))

const TopicContainer = styled.div`
  gap: 12px;
  display: flex;
  flex-wrap: wrap;
  a {
    text-decoration: none;
  }
`

const FilterMask = styled.div<{ $show: boolean }>`
  visibility: ${(props) => (props.$show ? 'visible' : 'hidden')};
  transition: visibility 0.3s ease-in-out;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: ${colorOpacity['black_0.2']};
  z-index: ${ZIndex.SideBar};
`

const FilterBox = styled.div<{ $show: boolean }>`
  transform: translateX(${(props) => (props.$show ? 0 : '100%')});
  transition: transform 0.3s ease-in-out;
  position: fixed;
  top: 0;
  right: 0;
  width: 520px;
  height: 100vh;
  background-color: ${colorGrayscale.white};
  overflow-x: hidden;
  overflow-y: hidden;
  box-shadow: 0px 0px 24px 0px ${colorOpacity['black_0.1']};
  z-index: ${ZIndex.SideBar};
  ${mq.mobileOnly`
    width: 100vw;
  `}
`

type LegislatorData = {
  name: string
  slug: string
  avatar?: string
  count: number
}

type TopicListProps = {
  isLoading?: boolean
  topicTitle: string
  topicSlug: string
  legislatorsData: LegislatorData[]
  speechesByLegislator: Record<string, SpeechData[]>
  currentMeetingTerm: number
  currentMeetingSession: number[]
}

const TopicList: React.FC<TopicListProps> = ({
  isLoading = true,
  topicTitle,
  topicSlug,
  legislatorsData,
  speechesByLegislator,
  currentMeetingTerm,
  currentMeetingSession,
}) => {
  const [selectedTab, setSelectedTab] = useState(0)
  const [showFilter, setShowFilter] = useState(false)
  const [tabList, setTabList] = useState(() =>
    mapToTabItems(legislatorsData).slice(0, maxTabs)
  )

  useEffect(() => {
    setTabList(mapToTabItems(legislatorsData).slice(0, maxTabs))
  }, [legislatorsData])

  const selectedLegislator = useMemo(() => {
    if (legislatorsData.length === 0 || !tabList[selectedTab]) return null

    const currentSlug = tabList[selectedTab].slug
    return (
      legislatorsData.find((legislator) => legislator.slug === currentSlug) ||
      null
    )
  }, [legislatorsData, selectedTab, tabList])

  const summaryList = useMemo<SummaryCardProps[]>(() => {
    if (!selectedLegislator || !speechesByLegislator[selectedLegislator.slug])
      return []

    return speechesByLegislator[selectedLegislator.slug].map(
      ({ title, date, summary, slug }) => ({
        title,
        date: new Date(date),
        summary,
        slug,
      })
    )
  }, [selectedLegislator, speechesByLegislator])

  const {
    data: topTopics,
    error: topTopicsError,
    isLoading: isLoadingTopTopics,
  } = useSWR(
    selectedLegislator?.slug
      ? [
          'fetchTopTopicsForLegislator',
          selectedLegislator.slug,
          currentMeetingTerm,
          currentMeetingSession,
        ]
      : null,
    ([, slug, term, sessions]) =>
      fetchTopTopicsForLegislator({
        legislatorSlug: slug,
        legislativeMeeting: term,
        legislativeMeetingSession: sessions,
      })
  )

  const issueList = useMemo<(IssueProps & { slug: string })[]>(() => {
    if (!selectedLegislator || topTopicsError || !topTopics) return []

    return topTopics.map((topic) => ({
      name: topic.title,
      slug: topic.slug,
      count: topic.speechesCount,
    }))
  }, [selectedLegislator, topTopics, topTopicsError])

  const followMoreTitle = useMemo(
    () =>
      selectedLegislator
        ? `${selectedLegislator.name} 近期關注的五大議題：`
        : '',
    [selectedLegislator]
  )

  const summaryGroupByYear = useMemo(
    () => groupSummary(summaryList),
    [summaryList]
  )

  const openFilter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setShowFilter(true)
  }, [])

  const handleTabChange = useCallback((index: number) => {
    setSelectedTab(index)
  }, [])

  const handleFilterConfirm = useCallback((filterList: TabProps[]) => {
    setTabList(
      filterList.map((legislator) => ({ ...legislator, showAvatar: true }))
    )
    setSelectedTab(0)
  }, [])

  const closeFilter = useCallback(() => {
    setShowFilter(false)
  }, [])

  if (isLoading) {
    return (
      <Container>
        <Title $isEmpty={true} text="發言摘要" />
        <Body>
          <EmptyState>
            <Loader useAbsolute={false} />
          </EmptyState>
        </Body>
      </Container>
    )
  }

  if (legislatorsData.length === 0) {
    return (
      <Container>
        <Title $isEmpty={true} text="發言摘要" />
        <Body>
          <EmptyState>
            <EmptyStateText text="所選會期無發言資訊" />
          </EmptyState>
        </Body>
      </Container>
    )
  }

  return (
    <Container>
      <Title text="發言摘要" />
      <TabNavigation
        tabs={tabList}
        selectedTab={selectedTab}
        setSelectedTab={handleTabChange}
        onFilterClick={openFilter}
      />
      <Body>
        <SummarySection>
          {summaryGroupByYear.map(
            (props: CardsOfTheYearProps, index: number) => (
              <CardsOfTheYear {...props} key={`summary-of-the-year-${index}`} />
            )
          )}
        </SummarySection>
        <FollowMoreItems title={followMoreTitle}>
          {isLoadingTopTopics && <Loader useAbsolute={false} />}
          {issueList.length > 0 && (
            <TopicContainer>
              {issueList.map((props, index) => (
                <Link
                  href={`${InternalRoutes.Topic}/${
                    props.slug
                  }?meetingTerm=${currentMeetingTerm}&sessionTerm=${JSON.stringify(
                    currentMeetingSession
                  )}`}
                  key={`follow-more-issue-${index}`}
                >
                  <Issue {...props} />
                </Link>
              ))}
            </TopicContainer>
          )}
        </FollowMoreItems>
      </Body>
      <FilterMask $show={showFilter}>
        <FilterBox $show={showFilter}>
          <FilterModal
            title={`${topicTitle} 的相關發言篩選`}
            slug={topicSlug}
            initialOption={legislatorsData}
            placeholder={'篩選立委'}
            initialSelectedOption={tabList}
            onClose={closeFilter}
            onConfirmSelection={handleFilterConfirm}
          />
        </FilterBox>
      </FilterMask>
    </Container>
  )
}

export default React.memo(TopicList)
