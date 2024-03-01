import { TemplateType } from '@/types/app';
// @ts-ignore
import type { ChatCompletionCreateParams } from 'openai/resources/chat';

export const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: 'get_templates',
    description: '获取模板',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'The number of stories to return. Defaults to 10.'
        }
      },
      required: []
    }
  },
  {
    name: 'get_story',
    description: 'Get a story from Hacker News. Also returns the Hacker News URL to the story.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The ID of the story'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'get_story_with_comments',
    description:
      'Get a story from Hacker News with comments.  Also returns the Hacker News URL to the story and each comment.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The ID of the story'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'summarize_top_story',
    description:
      'Summarize the top story from Hacker News, including both the story and its comments. Also returns the Hacker News URL to the story and each comment.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

async function get_templates(limit: number = 10) {
  const response = await fetch('https://template.cloud.sealos.io/api/v1alpha/listTemplate');
  const data = (await response.json()) as {
    data: TemplateType[];
  };
  return data.data.map((item) => item.spec.title);
}

async function get_story(id: number) {
  const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
  const data = await response.json();
  return {
    ...data,
    hnUrl: `https://news.ycombinator.com/item?id=${id}`
  };
}

async function get_story_with_comments(id: number) {
  const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
  const data = await response.json();
  const comments = await Promise.all(data.kids.slice(0, 10).map((id: number) => get_story(id)));
  return {
    ...data,
    hnUrl: `https://news.ycombinator.com/item?id=${id}`,
    comments: comments.map((comment: any) => ({
      ...comment,
      hnUrl: `https://news.ycombinator.com/item?id=${comment.id}`
    }))
  };
}

export async function runFunction(name: string, args: any) {
  switch (name) {
    case 'get_templates':
      return await get_templates();
    case 'get_story':
      return await get_story(args['id']);
    case 'get_story_with_comments':
      return await get_story_with_comments(args['id']);

    default:
      return null;
  }
}
