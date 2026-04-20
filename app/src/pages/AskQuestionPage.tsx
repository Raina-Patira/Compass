import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Loader2, X, Users, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { questionsApi, expertsApi, aiApi } from '@/services/api'
import type { Tag, Expert } from '@/types'
import { toast } from 'sonner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

const AskQuestionPage: React.FC = () => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([])
  const [suggestedExperts, setSuggestedExperts] = useState<Expert[]>([])
  const [similarQuestions, setSimilarQuestions] = useState<any[]>([])

  useEffect(() => {
    fetchTags();
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (title.length > 10 && content.length > 20) {
        extractTags()
        findSimilarQuestions()
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [title, content])

  const fetchTags = async () => {
    try {
      const response = await expertsApi.getTags()
      setAvailableTags(response.data.tags)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const extractTags = async () => {
    if (isExtracting) return
    setIsExtracting(true)
    try {
      const response = await aiApi.extractTags(title, content)
      const extracted = response.data.tags
      console.log('yes ', response)
      // Map extracted tags to available tags
      setSuggestedTags(extracted)
      //     const matched = extracted
      // .map((et: any) =>
      //   availableTags.find(at =>
      //     at.name.toLowerCase().includes(et.name.toLowerCase())
      //   )
      // )
      // .filter(Boolean);
      // setSuggestedTags(matched);
    } catch (error) {
      console.error('Failed to extract tags:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  const findSimilarQuestions = async () => {
    try {
      const response = await aiApi.findSimilarQuestions(title, content)
      setSimilarQuestions(response.data.questions)
    } catch (error) {
      console.error('Failed to find similar questions:', error)
    }
  }

  const findExperts = async () => {
    if (selectedTags.length === 0) return
    try {
      const response = await aiApi.findExperts('temp', selectedTags, content)
      setSuggestedExperts(response.data.experts)
    } catch (error) {
      console.error('Failed to find experts:', error)
    }
  }

  useEffect(() => {
    if (selectedTags.length > 0) {
      findExperts()
    }
  }, [selectedTags])

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (title.length < 10) {
      toast.error('Title must be at least 10 characters')
      return
    }
    if (content.length < 20) {
      toast.error('Content must be at least 20 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await questionsApi.create({
        title,
        content,
        tags: selectedTags
      })
      toast.success('Question posted successfully!')
      navigate(`/questions/${response.data.question.id}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to post question')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Ask a Question</h1>
        <p className='text-muted-foreground'>
          Get help from your organization's experts
        </p>
      </div>

      <div className='grid lg:grid-cols-3 gap-6'>
        {/* Main Form */}
        <div className='lg:col-span-2'>
          <Card>
            <CardContent className='p-6'>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='title'>Title</Label>
                  <Input
                    id='title'
                    placeholder="What's your question? Be specific."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                  <p className='text-xs text-muted-foreground'>
                    Minimum 10 characters
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='content'>Details</Label>
                  <Textarea
                    id='content'
                    placeholder="Describe your question in detail. Include what you've tried and what you're expecting."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={8}
                    required
                  />
                  <p className='text-xs text-muted-foreground'>
                    Minimum 20 characters
                  </p>
                </div>

                {/* AI Suggested Tags */}
                {suggestedTags.length > 0 && (
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <Sparkles className='w-4 h-4 text-primary' />
                      <Label className='text-primary'>AI Suggested Tags</Label>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {suggestedTags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={
                            selectedTags.includes(tag.id)
                              ? 'default'
                              : 'secondary'
                          }
                          className='cursor-pointer'
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                          {selectedTags.includes(tag.id) && (
                            <X className='w-3 h-3 ml-1' />
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Tags */}
                {/* <div className='space-y-2'>
                  <Label>Select Tags</Label>
                  <div className='flex flex-wrap gap-2'>
                    {availableTags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={
                          selectedTags.includes(tag.id) ? 'default' : 'outline'
                        }
                        className='cursor-pointer'
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div> */}

                <div className='space-y-3'>
                  {/* Selected Tags (like old UI) */}
                  <div className='flex flex-wrap gap-2'>
                    {selectedTags.map(tagId => {
                      const tag = availableTags.find(t => t.id === tagId)
                      if (!tag) return null

                      return (
                        <Badge
                          key={tag.id}
                          variant='default'
                          className='flex items-center gap-1'
                          onClick={() => handleTagToggle(tag.id)}
                        >
                          {tag.name}
                        </Badge>
                      )
                    })}
                  </div>

                  {/* Dropdown */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-between'
                      >
                        {selectedTags.length > 0
                          ? `${selectedTags.length} selected`
                          : 'Select tags'}
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className='w-64'>
                      <div className='space-y-2 max-h-60 overflow-y-auto'>
                        {availableTags.map(tag => (
                          <div
                            key={tag.id}
                            className='flex items-center space-x-2'
                          >
                            <Checkbox
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => handleTagToggle(tag.id)}
                            />
                            <span>{tag.name}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className='flex gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={
                      isSubmitting || title.length < 1 || content.length < 1
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Posting...
                      </>
                    ) : (
                      'Post Question'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* AI Assistant */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm flex items-center gap-2'>
                <Sparkles className='w-4 h-4 text-primary' />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {isExtracting ? (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Analyzing your question...
                </div>
              ) : suggestedTags.length > 0 ? (
                <div className='text-sm'>
                  <p className='text-muted-foreground mb-2'>
                    We've identified relevant tags for your question.
                  </p>
                </div>
              ) : (
                <div className='text-sm text-muted-foreground'>
                  Start typing to get AI-powered tag suggestions.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Experts */}
          {suggestedExperts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <Users className='w-4 h-4' />
                  Suggested Experts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {suggestedExperts.slice(0, 3).map(expert => (
                    <div
                      key={expert.id}
                      className='flex items-center gap-3 p-2 rounded-lg hover:bg-accent'
                    >
                      <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                        <span className='text-xs text-primary'>
                          {expert.firstName[0]}
                          {expert.lastName[0]}
                        </span>
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate'>
                          {expert.firstName} {expert.lastName}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {expert.matchScore}% match
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Similar Questions */}
          {similarQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <Lightbulb className='w-4 h-4' />
                  Similar Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {similarQuestions.slice(0, 3).map(q => (
                    <a
                      key={q.id}
                      href={`/questions/${q.id}`}
                      className='block text-sm hover:text-primary line-clamp-2'
                    >
                      {q.title}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Tips for Good Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>• Be specific and concise</li>
                <li>• Include relevant context</li>
                <li>• Mention what you've tried</li>
                <li>• Use appropriate tags</li>
                <li>• Proofread before posting</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AskQuestionPage
