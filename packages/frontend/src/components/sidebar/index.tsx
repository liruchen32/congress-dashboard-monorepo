'use client'

import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  RefAttributes,
} from 'react'
import styled from 'styled-components'
// context
import { DashboardContext } from '@/components/dashboard/context'
// fetcher
import { fetchLegislatorsOfATopic } from '@/fetchers/legislator'
import { fetchTopicOfALegislator } from '@/fetchers/topic'
import useSpeech from '@/fetchers/speech'
import useCommitteeMember from '@/fetchers/committee-member'
// hook
import {
  useMoreTopics,
  useMoreLegislators,
} from '@/components/sidebar/hook/use-follow-more'
// constants
import { InternalRoutes } from '@/constants/routes'
// components
import TitleSection, {
  TitleSectionProps,
} from '@/components/sidebar/title-section'
import CardsOfTheYear, {
  SummaryCardProps,
  CardsOfTheYearProps,
} from '@/components/sidebar/card'
import {
  Issue,
  IssueProps,
  Legislator,
  LegislatorProps,
} from '@/components/sidebar/follow-more'
import FilterModal from '@/components/sidebar/filter-modal'
import { Loader } from '@/components/loader'
// @twreporter
import { H5 } from '@twreporter/react-components/lib/text/headline'
import { P1 } from '@twreporter/react-components/lib/text/paragraph'
import {
  colorGrayscale,
  colorOpacity,
} from '@twreporter/core/lib/constants/color'
import mq from '@twreporter/core/lib/utils/media-query'
// lodash
import { get, groupBy, forEach } from 'lodash'
const _ = {
  get,
  groupBy,
  forEach,
}

// sidebar issue component
const Box = styled.div`
  width: 520px;
  height: 100vh;
  background-color: ${colorGrayscale.white};
  overflow-x: hidden;
  box-shadow: 0px 0px 24px 0px ${colorOpacity['black_0.1']};

  ${mq.tabletOnly`
    width: 50vw;
    max-width: 520px;  
  `}
`
const ContentBox = styled.div<{ $show: boolean }>`
  ${(props) => (props.$show ? '' : 'display: none;')}
`
const FilterBox = styled.div<{ $show: boolean }>`
  ${(props) => (props.$show ? '' : 'display: none;')}
  height: 100%;
  position: relative;
  overflow-y: hidden;
`
const Body = styled.div`
  display: flex;
  padding: 24px 24px 40px 24px;
  flex-direction: column;
  align-items: flex-start;
  gap: 40px;
`
const SummarySection = styled.div`
  gap: 32px;
  display: flex;
  flex-direction: column;
`
const FollowMoreSection = styled.div`
  border-top: 1px solid ${colorGrayscale.gray300};
  padding-top: 40px;
  gap: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
`
const FollowMoreTitle = styled(H5)`
  color: ${colorGrayscale.gray800};
`
const FollowMoreTags = styled.div`
  gap: 12px;
  display: flex;
  flex-wrap: wrap;
`

export function groupSummary(summaryList: SummaryCardProps[]) {
  const result: CardsOfTheYearProps[] = []
  const summaryGroupByYear = _.groupBy(summaryList, (summary) =>
    new Date(summary.date).getFullYear()
  )
  _.forEach(
    summaryGroupByYear,
    (summarys: SummaryCardProps[], year: number | string) =>
      result.push({ year: Number(year), cards: summarys })
  )

  return result
}

export interface SidebarIssueProps extends RefAttributes<HTMLDivElement> {
  title: TitleSectionProps['title']
  count: TitleSectionProps['count']
  legislatorList?: TitleSectionProps['tabs'] & { id?: number }
  slug: string
  onClose?: () => void
  className?: string
}
export const SidebarIssue: React.FC<SidebarIssueProps> = ({
  slug,
  title,
  count,
  legislatorList = [],
  onClose,
  className,
  ref,
}: SidebarIssueProps) => {
  const [tabList, setTabList] = useState(legislatorList)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState(0)
  const [showFilter, setShowFilter] = useState(false)
  const selectedLegislator = useMemo(
    () => _.get(tabList, selectedTab),
    [tabList, selectedTab]
  )
  const followMoreTitle: string = useMemo(
    () => `${_.get(selectedLegislator, ['name'], '')} 近期關注的五大議題：`,
    [selectedLegislator]
  )
  const { formattedFilterValues } = useContext(DashboardContext)
  const speechState = useSpeech(
    formattedFilterValues && selectedLegislator
      ? {
          legislatorSlug: selectedLegislator.slug as string,
          topicSlug: slug,
          legislativeMeetingId: formattedFilterValues?.meetingId,
          legislativeMeetingSessionIds: formattedFilterValues?.sessionIds,
        }
      : undefined
  )
  const summaryList: SummaryCardProps[] = useMemo(
    () => speechState.speeches || [],
    [speechState.speeches]
  )
  const summaryGroupByYear: CardsOfTheYearProps[] = useMemo(
    () => groupSummary(summaryList),
    [summaryList]
  )
  const followMoreState = useMoreTopics(
    formattedFilterValues && selectedLegislator && selectedLegislator.id
      ? {
          legislatorId: selectedLegislator.id,
          excluideTopicSlug: slug,
          legislativeMeetingId: formattedFilterValues?.meetingId,
          legislativeMeetingSessionIds: formattedFilterValues?.sessionIds,
        }
      : undefined
  )
  const issueList: IssueProps[] = useMemo(
    () => followMoreState.topics || [],
    [followMoreState.topics]
  )

  const fetchFilterOptions = (legislatorSlug: string) => {
    if (!formattedFilterValues) {
      throw new Error(
        `Failed to fetch filter options. err: filter value undefined.`
      )
    }
    return fetchLegislatorsOfATopic({
      slug: legislatorSlug,
      legislativeMeetingId: formattedFilterValues?.meetingId,
      legislativeMeetingSessionIds: formattedFilterValues?.sessionIds,
    })
  }

  useEffect(() => {
    setIsLoading(true)
  }, [slug])

  useEffect(() => {
    if (speechState.speeches != undefined) {
      setIsLoading(speechState.isLoading || followMoreState.isLoading)
    }
  }, [speechState.speeches, speechState.isLoading, followMoreState.isLoading])

  useEffect(() => {
    setSelectedTab(0)
  }, [tabList])

  useEffect(() => {
    if (legislatorList) {
      setTabList(legislatorList)
    }
  }, [legislatorList])

  return (
    <Box className={className} ref={ref}>
      <ContentBox $show={!showFilter}>
        <TitleSection
          title={title}
          count={count}
          tabs={tabList}
          showTabAvatar={true}
          link={`${InternalRoutes.Topic}/${slug}`}
          onSelectTab={setSelectedTab}
          onOpenFilterModal={() => setShowFilter(true)}
          onClose={onClose}
        />
        {isLoading ? (
          <Loader />
        ) : (
          <Body>
            <SummarySection>
              {summaryGroupByYear.map(
                (props: CardsOfTheYearProps, index: number) => (
                  <CardsOfTheYear
                    {...props}
                    key={`summary-of-the-year-${index}`}
                  />
                )
              )}
            </SummarySection>
            <FollowMoreSection>
              <FollowMoreTitle text={followMoreTitle} />
              {issueList.length > 0 ? (
                <FollowMoreTags>
                  {issueList.map((props: IssueProps, index: number) => (
                    <Issue {...props} key={`follow-more-issue-${index}`} />
                  ))}
                </FollowMoreTags>
              ) : null}
            </FollowMoreSection>
          </Body>
        )}
      </ContentBox>
      {showFilter ? (
        <FilterBox $show={showFilter}>
          <FilterModal
            title={`${title} 的相關發言篩選`}
            slug={slug}
            placeholder={'篩選立委'}
            initialSelectedOption={tabList}
            fetcher={fetchFilterOptions}
            onClose={() => {
              setShowFilter(false)
            }}
            onConfirmSelection={setTabList}
          />
        </FilterBox>
      ) : null}
    </Box>
  )
}

// sidebar legislator component
const FollowMoreLegislator = styled.div`
  gap: 32px;
  display: flex;
  overflow-x: scroll;
`
const Note = styled(P1)`
  color: ${colorGrayscale.gray800};
`

export interface SidebarLegislatorProps extends RefAttributes<HTMLDivElement> {
  title: TitleSectionProps['title']
  issueList?: TitleSectionProps['tabs']
  slug: string
  note?: string
  onClose?: () => void
  className?: string
}
export const SidebarLegislator: React.FC<SidebarLegislatorProps> = ({
  slug,
  title,
  issueList = [],
  note,
  onClose,
  className,
  ref,
}: SidebarLegislatorProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [tabList, setTabList] = useState(issueList)
  const [selectedTab, setSelectedTab] = useState(0)
  const [showFilter, setShowFilter] = useState(false)
  const showNote = useMemo(
    () => note && issueList.length === 0,
    [note, issueList]
  )
  const selectedIssue = useMemo(
    () => _.get(tabList, selectedTab),
    [tabList, selectedTab]
  )
  const followMoreTitle: string = useMemo(
    () => `關注 ${_.get(selectedIssue, ['name'], '')} 主題的其他人：`,
    [selectedIssue]
  )
  const { formattedFilterValues } = useContext(DashboardContext)
  const { committees } = useCommitteeMember(
    formattedFilterValues
      ? {
          slug,
          legislativeMeetingId: formattedFilterValues.meetingId,
        }
      : undefined
  )
  const subtitle = useMemo(() => {
    if (!committees || committees.length === 0) {
      return ''
    }
    return committees.reduce((acc, { count, name }, index) => {
      if (index !== 0) {
        acc += '、'
      }
      acc += `${name}(${count}會期)`

      return acc
    }, '本屆加入：')
  }, [committees])
  const speechState = useSpeech(
    formattedFilterValues && selectedIssue
      ? {
          legislatorSlug: slug,
          topicSlug: selectedIssue.slug as string,
          legislativeMeetingId: formattedFilterValues.meetingId,
          legislativeMeetingSessionIds: formattedFilterValues.sessionIds,
        }
      : undefined
  )
  const summaryList: SummaryCardProps[] = useMemo(
    () => speechState.speeches || [],
    [speechState.speeches]
  )
  const summaryGroupByYear: CardsOfTheYearProps[] = useMemo(
    () => groupSummary(summaryList),
    [summaryList]
  )
  const followMoreState = useMoreLegislators(
    formattedFilterValues && selectedIssue && selectedIssue.slug
      ? {
          topicSlug: selectedIssue.slug,
          excluideLegislatorSlug: slug,
          legislativeMeetingId: formattedFilterValues?.meetingId,
          legislativeMeetingSessionIds: formattedFilterValues?.sessionIds,
          partyIds: formattedFilterValues.partyIds,
          constituencies: formattedFilterValues.constituency,
          committeeSlugs: formattedFilterValues.committeeSlugs,
        }
      : undefined
  )
  const legislatorList: LegislatorProps[] = useMemo(
    () => followMoreState.legislators || [],
    [followMoreState.legislators]
  )

  const fetchFilterOptions = (legislatorSlug: string) => {
    if (!formattedFilterValues) {
      throw new Error(
        `Failed to fetch filter options. err: filter value undefined.`
      )
    }
    return fetchTopicOfALegislator({
      slug: legislatorSlug,
      legislativeMeetingId: formattedFilterValues?.meetingId,
      legislativeMeetingSessionIds: formattedFilterValues?.sessionIds,
    })
  }

  useEffect(() => {
    setIsLoading(true)
  }, [slug])

  useEffect(() => {
    if (issueList) {
      setTabList(issueList)
    }
  }, [issueList])

  useEffect(() => {
    if (speechState.speeches != undefined) {
      setIsLoading(speechState.isLoading || followMoreState.isLoading)
    }
  }, [speechState.speeches, speechState.isLoading, followMoreState.isLoading])

  useEffect(() => {
    setSelectedTab(0)
  }, [tabList])

  return (
    <Box className={className} ref={ref}>
      <ContentBox $show={!showFilter}>
        <TitleSection
          title={title}
          subtitle={subtitle}
          tabs={tabList}
          showTabAvatar={false}
          link={`${InternalRoutes.Legislator}/${slug}`}
          onSelectTab={setSelectedTab}
          onClose={onClose}
          onOpenFilterModal={() => setShowFilter(true)}
        />
        {showNote ? (
          <Body>
            <Note text={note} />
          </Body>
        ) : isLoading ? (
          <Loader />
        ) : (
          <Body>
            <SummarySection>
              {summaryGroupByYear.map(
                (props: CardsOfTheYearProps, index: number) => (
                  <CardsOfTheYear
                    {...props}
                    key={`summary-of-the-year-${index}`}
                  />
                )
              )}
            </SummarySection>
            <FollowMoreSection>
              <FollowMoreTitle text={followMoreTitle} />
              {legislatorList.length > 0 ? (
                <FollowMoreLegislator>
                  {legislatorList.map(
                    (props: LegislatorProps, index: number) => (
                      <Legislator
                        {...props}
                        key={`follow-more-legislator-${index}`}
                      />
                    )
                  )}
                </FollowMoreLegislator>
              ) : null}
            </FollowMoreSection>
          </Body>
        )}
      </ContentBox>
      {showFilter ? (
        <FilterBox $show={showFilter}>
          <FilterModal
            title={`${title} 的相關發言篩選`}
            subtitle={subtitle}
            slug={slug}
            placeholder={'篩選議題'}
            initialSelectedOption={tabList}
            fetcher={fetchFilterOptions}
            onClose={() => {
              setShowFilter(false)
            }}
            onConfirmSelection={setTabList}
          />
        </FilterBox>
      ) : null}
    </Box>
  )
}
