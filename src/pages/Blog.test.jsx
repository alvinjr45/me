import React from 'react';
import { render, screen } from '@testing-library/react';
import { getBlogPosts } from '../data/blogPosts';
import Blog from './Blog';

jest.mock('../data/blogPosts', () => ({ getBlogPosts: jest.fn() }));

test('includes dog posts in the general blog', async () => {
  getBlogPosts.mockResolvedValue([
    { slug: 'site-note', title: 'Site note', excerpt: 'A build update.', date: 'Today', eyebrow: 'Site', tags: ['site'], sections: [], media: [] },
    { slug: 'dog-note', title: 'Dog note', excerpt: 'A dog update.', date: 'Today', eyebrow: 'Dogs', tags: ['dogs'], sections: [], media: [] }
  ]);

  render(<Blog />);

  expect((await screen.findAllByText('Site note')).length).toBeGreaterThan(0);
  expect(screen.getAllByText('Dog note').length).toBeGreaterThan(0);
  expect(screen.getAllByRole('button', { name: /dogs/i }).length).toBeGreaterThan(0);
});
