import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Plus, MessageSquare, Filter, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { questionsApi, expertsApi } from '@/services/api'
import type { Question, Tag } from '@/types'

const QuestionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [questions, setQuestions] = useState<Question[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [, setSortBy] = useState('newest')
  const [, setStatus] = useState('open')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchTags()
    fetchQuestions()
  }, [searchParams])

  const fetchTags = async () => {
    try {
      const response = await expertsApi.getTags()
      setTags(response.data.tags)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }
  console.log('yes2', searchParams)
  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const params = {
        page: parseInt(searchParams.get('page') || '1'),
        limit: 20,
        search: searchParams.get('search') || undefined,
        tag: searchParams.get('tag') || undefined,
        status: searchParams.get('status') || 'open',
        sortBy: searchParams.get('sortBy') || 'newest'
      }

      const response = await questionsApi.getAll(params)
      console.log('yes', response)
      setQuestions(response.data.questions)
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const newParams = new URLSearchParams(searchParams)
    if (searchQuery) {
      newParams.set('search', searchQuery)
    } else {
      newParams.delete('search')
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
  }

  const handleTagSelect = (tag: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (tag) {
      newParams.set('tag', tag)
    } else {
      newParams.delete('tag')
    }
    newParams.set('page', '1')
    setSearchParams(newParams)
    setSelectedTag(tag)
  }

  const handleSortChange = (sort: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('sortBy', sort)
    setSearchParams(newParams)
    setSortBy(sort)
  }

  const handleStatusChange = (newStatus: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('status', newStatus)
    setSearchParams(newParams)
    setStatus(newStatus)
  }

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', page.toString())
    setSearchParams(newParams)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Questions</h1>
          <p className='text-muted-foreground'>
            Browse and search questions from your community
          </p>
        </div>
        <Button asChild>
          <Link to='/ask'>
            <Plus className='w-4 h-4 mr-2' />
            Ask Question
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <form onSubmit={handleSearch} className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search questions...'
              className='pl-10'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        <div className='flex gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='flex items-center gap-2'>
                <Filter className='w-4 h-4' />
                Status
                <ChevronDown className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleStatusChange('all')}>
                All Questions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('open')}>
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('answered')}>
                Answered
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='flex items-center gap-2'>
                Sort by
                <ChevronDown className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSortChange('newest')}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('popular')}>
                Most Popular
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortChange('unanswered')}>
                Unanswered First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tags */}
      <div className='flex flex-wrap gap-2'>
        <Badge
          variant={selectedTag === '' ? 'default' : 'secondary'}
          className='cursor-pointer'
          onClick={() => handleTagSelect('')}
        >
          All
        </Badge>
        {tags.slice(0, 10).map(tag => (
          <Badge
            key={tag.id}
            variant={selectedTag === tag.name ? 'default' : 'secondary'}
            className='cursor-pointer'
            onClick={() => handleTagSelect(tag.name)}
          >
            {tag.name}
          </Badge>
        ))}
      </div>

      {/* Questions List */}
      <div className='space-y-4'>
        {isLoading ? (
          <div className='space-y-4'>
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className='animate-pulse'>
                <CardContent className='p-6'>
                  <div className='h-4 bg-muted rounded w-3/4 mb-4' />
                  <div className='h-3 bg-muted rounded w-1/2' />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : questions.length > 0 ? (
          <>
            {questions.map(question => (
              <Card
                key={question.id}
                className='hover:border-primary/50 transition-colors'
              >
                <CardContent className='p-6'>
                  <div className='flex gap-4'>
                    {/* Stats */}
                    <div className='flex flex-col items-center gap-2 min-w-[80px]'>
                      <div className='text-center'>
                        <p className='text-lg font-bold'>{question.upvotes}</p>
                        <p className='text-xs text-muted-foreground'>votes</p>
                      </div>
                      <div
                        className={`text-center px-3 py-1 rounded-lg ${
                          question.status === 'answered'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-muted'
                        }`}
                      >
                        <p className='text-lg font-bold'>
                          {question.answerCount}
                        </p>
                        <p className='text-xs'>answers</p>
                      </div>
                      <div className='text-center'>
                        <p className='text-sm'>{question.viewCount}</p>
                        <p className='text-xs text-muted-foreground'>views</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <Link
                        to={`/questions/${question.id}`}
                        className='text-lg font-semibold hover:text-primary line-clamp-2'
                      >
                        {question.title}
                      </Link>
                      <p className='text-muted-foreground mt-1 line-clamp-2'>
                        {question.content}
                      </p>
                      <div className='flex flex-wrap items-center gap-3 mt-3'>
                        {question.tags.map(tag => (
                          <Badge
                            key={tag.id}
                            variant='secondary'
                            className='text-xs'
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                      <div className='flex items-center justify-between mt-4'>
                        <div className='flex items-center gap-2'>
                          {question.author?.avatarUrl ? (
                            <img
                              src={question.author.avatarUrl}
                              alt={question.author.firstName}
                              className='w-6 h-6 rounded-full'
                            />
                          ) : (
                            <div className='w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center'>
                              <span className='text-xs text-primary'>
                                {question.author?.firstName?.[0]}
                              </span>
                            </div>
                          )}
                          <span className='text-sm text-muted-foreground'>
                            {question.author?.firstName}{' '}
                            {question.author?.lastName}
                          </span>
                          <span className='text-sm text-muted-foreground'>
                            asked{' '}
                            {new Date(question.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex justify-center gap-2 mt-6'>
                <Button
                  variant='outline'
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className='flex items-center px-4 text-sm text-muted-foreground'>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant='outline'
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className='p-12 text-center'>
              <MessageSquare className='w-12 h-12 mx-auto mb-4 text-muted-foreground' />
              <h3 className='text-lg font-semibold mb-2'>No questions found</h3>
              <p className='text-muted-foreground mb-4'>
                Be the first to ask a question in this category
              </p>
              <Button asChild>
                <Link to='/ask'>Ask a Question</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default QuestionsPage
