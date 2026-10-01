import React from 'react';
import { render, screen } from '@testing-library/react';
import { getBlogPosts } from '../data/blogPosts';
import Blog from './Blog';

jest.mock('../data/blogPosts', () => ({ getBlogPosts: jest.fn() }));

test('keeps the Dogs category in Field notes instead of the general blog', async () => {
  getBlogPosts.mockResolvedValue([
    { slug: 'site-note', title: 'Site note', excerpt: 'A build update.', date: 'Today', eyebrow: 'Site', tags: ['site'], sections: [], media: [] },
    { slug: 'dog-note', title: 'Dog note', excerpt: 'A dog update.', date: 'Today', eyebrow: 'Dogs', tags: ['dogs'], sections: [], media: [] }
  ]);

  render(<Blog />);

  expect((await screen.findAllByText('Site note')).length).toBeGreaterThan(0);
  expect(screen.queryByText('Dog note')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /dogs/i })).not.toBeInTheDocument();
});
