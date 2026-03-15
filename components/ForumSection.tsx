'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Button from './ui/Button';
import ArrowSeemore from './icons/ArrowSeemore';
import { usePathname } from 'next/navigation';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@heroui/dropdown';
import ArrowDropdown from './icons/ArrowDropdown';
import { Search } from 'lucide-react';

interface ForumData {
  forum_id: number;
  parent_id: number;
  forum_type: number;
  forum_name: string;
  forum_desc: string;
  topics: number;
  posts: number;
  last_post_time: number;
  last_post_subject: string;
  last_post_author: string;
  last_topic_id: number | null;
}

type SortOption = 'recent' | 'topics' | 'posts' | 'name';

const MODEL_FILTERS = [
  { key: 'DF25', label: 'DF25' },
  { key: 'DF800', label: 'DF800' },
  { key: 'DF28', label: 'DF28' },
  { key: 'DF920', label: 'DF920' },
  { key: 'DF1000', label: 'DF1000' },
  { key: 'DF32', label: 'DF32' },
  { key: 'DF35', label: 'DF35' },
  { key: 'DF1200', label: 'DF1200' },
  { key: 'DF40', label: 'DF40' }
] as const;

export default function ForumSection() {
  const [forumData, setForumData] = useState<ForumData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedModel, setSelectedModel] = useState<string>('DF25');
  const pathname = usePathname();

  useEffect(() => {
    async function fetchForumData() {
      try {
        const response = await fetch('/api/forum');
        const data = await response.json();

        if (Array.isArray(data)) {
          setForumData(data);
        } else {
          setError(data.error || 'Failed to load forum data');
        }
      } catch (err) {
        console.error('Error fetching forum:', err);
        setError('Failed to load forum data');
      } finally {
        setLoading(false);
      }
    }

    fetchForumData();
  }, []);

  const allCategories = useMemo(
    () => forumData.filter((f) => f.forum_type === 0),
    [forumData]
  );

  const generalCategory = useMemo(
    () => (allCategories.length > 0 ? allCategories[0] : null),
    [allCategories]
  );

  const modelCategories = useMemo(() => {
    const models = allCategories.slice(1);
    return models.filter((c) =>
      c.forum_name.toUpperCase().includes(selectedModel.toUpperCase())
    );
  }, [allCategories, selectedModel]);

  const categories = useMemo(() => {
    return generalCategory
      ? [generalCategory, ...modelCategories]
      : modelCategories;
  }, [generalCategory, modelCategories]);

  const filteredAndSortedForums = useMemo(() => {
    let forums = forumData.filter((f) => f.forum_type === 1);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      forums = forums.filter(
        (f) =>
          f.forum_name.toLowerCase().includes(query) ||
          f.forum_desc.toLowerCase().includes(query) ||
          f.last_post_author?.toLowerCase().includes(query)
      );
    }

    forums.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.last_post_time - a.last_post_time;
        case 'topics':
          return b.topics - a.topics;
        case 'posts':
          return b.posts - a.posts;
        case 'name':
          return a.forum_name.localeCompare(b.forum_name);
        default:
          return 0;
      }
    });

    return forums;
  }, [forumData, searchQuery, sortBy]);

  const forumsByParent = useMemo(() => {
    return filteredAndSortedForums.reduce(
      (acc, f) => {
        if (!acc[f.parent_id]) {
          acc[f.parent_id] = [];
        }
        acc[f.parent_id].push(f);
        return acc;
      },
      {} as Record<number, ForumData[]>
    );
  }, [filteredAndSortedForums]);

  const sortOptions = [
    { key: 'recent', label: 'Most Recent' },
    { key: 'topics', label: 'Most Topics' },
    { key: 'posts', label: 'Most Posts' },
    { key: 'name', label: 'Name (A-Z)' }
  ];

  if (loading) {
    return <section className="w-full py-16 max-w-screen-xl mx-auto"></section>;
  }

  if (error) {
    return <></>;
  }

  const renderForumItem = (forum: ForumData) => (
    <a
      key={forum.forum_id}
      href={`https://www.dragonfly-trimarans.org/phpBB/viewforum.php?f=${forum.forum_id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-row justify-between items-center gap-8 sm:gap-16 border-t-1 last:border-b-2 py-4 sm:py-6 border-stonegrey group cursor-pointer"
    >
      <div className="flex flex-col justify-between items-start gap-2 sm:gap-4 flex-1 min-w-0">
        {forum.last_post_time ? (
          <div className="flex flex-row gap-4 items-center flex-wrap">
            <p
              className={`text-[10px] sm:text-12 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite/60'}`}
            >
              by {forum.last_post_author}
            </p>
            <p
              className={`text-[10px] sm:text-12 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite/60'}`}
              suppressHydrationWarning
            >
              {new Date(forum.last_post_time * 1000).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }
              )}
            </p>
          </div>
        ) : (
          <p className="italic text-stonegrey text-[10px] sm:text-12">
            No posts yet
          </p>
        )}
        <p
          className={`text-14 sm:text-20 lg:text-32 font-medium ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'}`}
        >
          {forum.forum_name}
        </p>
        <div
          className={`flex gap-2 sm:gap-4 text-[10px] sm:text-14 flex-wrap ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'}`}
        >
          <span
            className={`px-2 sm:px-4 py-0.5 sm:py-1 rounded-full ${pathname === '/forum' ? 'text-fullwhite bg-oceanblue' : 'text-oceanblue bg-fullwhite'}`}
          >
            {forum.topics} Topic{forum.topics !== 1 ? 's' : ''}
          </span>
          <span
            className={`px-2 sm:px-4 py-0.5 sm:py-1 rounded-full ${pathname === '/forum' ? 'text-fullwhite bg-oceanblue' : 'text-oceanblue bg-fullwhite'}`}
          >
            {forum.posts} Post{forum.posts !== 1 ? 's' : ''}
          </span>
        </div>
        <p
          className={`text-14 lg:text-16 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite/70'} hidden sm:block`}
        >
          {forum.forum_desc}
        </p>
      </div>
      <div
        className={`flex-shrink-0 w-[28px] h-[28px] sm:w-[40px] sm:h-[40px] flex items-center justify-center rounded-full transition-all duration-300 ${pathname === '/forum' ? 'text-oceanblue bg-lightgrey group-hover:text-fullwhite group-hover:bg-oceanblue' : 'text-fullwhite bg-fullwhite/10 group-hover:text-oceanblue group-hover:bg-fullwhite'}`}
      >
        <ArrowSeemore className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
    </a>
  );

  return (
    <section
      className={`w-full ${pathname === '/forum' ? 'bg-fullwhite' : 'bg-gradient-to-b pt-[60px] lg:pt-[120px] from-articblue to-oceanblue'}`}
    >
      <div className="mx-auto max-w-screen-xl flex flex-col gap-32 lg:gap-64 items-center justify-center px-8 xs:px-16 xl:px-0">
        {pathname !== '/forum' && (
          <>
            <div className="flex flex-col gap-24 lg:gap-32 items-center justify-center lg:max-w-[800px] mx-auto">
              <h2
                className={`text-18 xs:text-24 lg:text-48 text-center ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'}`}
              >
                Latest Forum Discussions
              </h2>
              <p
                className={`text-14 lg:text-16 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'} text-center`}
              >
                Engage with fellow enthusiasts, share insights, and get answers
                to your questions about Dragonfly trimarans, maintenance,
                sailing tips, and more. For comprehensive discussions and to
                participate fully, please visit our main forum accessible here
                or via the navigation menu.
              </p>
              <div className="flex flex-col sm:flex-row gap-16 lg:gap-32 items-center">
                <Button
                  text="more topics"
                  icon="link"
                  bgColor="bg-fullwhite"
                  iconColor="text-oceanblue"
                  href="/forum"
                />
                <Button
                  text="discover the forum"
                  icon="link"
                  bgColor="bg-oceanblue"
                  iconColor="text-fullwhite"
                  href="https://www.dragonfly-trimarans.org/phpBB"
                />
              </div>
            </div>

            {pathname !== '/forum' && searchQuery && (
              <div className="w-full text-fullwhite text-14">
                {filteredAndSortedForums.length > 0 ? (
                  <p>
                    Found {filteredAndSortedForums.length} forum
                    {filteredAndSortedForums.length !== 1 ? 's' : ''} matching "
                    {searchQuery}"
                  </p>
                ) : (
                  <p className="text-stonegrey">
                    No forums found matching "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {pathname === '/forum' && (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-16">
              <h1 className="text-oceanblue text-32 md:text-56">
                <span className="text-articblue">Topics</span>
              </h1>
              <p className="text-darkgrey w-full md:w-1/2 text-14 md:text-16 font-light">
                Explore discussions, search for specific topics, and sort by
                activity. Join our community of Dragonfly enthusiasts and share
                your passion for sailing.
              </p>
            </div>

            {/* Barre de recherche et tri */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full">
              <div className="relative flex-1 max-w-full sm:max-w-[500px]">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-oceanblue"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search forums, topics, or authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full pl-12 pr-5 h-12 bg-lightgrey text-oceanblue placeholder:text-stonegrey focus:outline-none focus:ring-2 focus:ring-articblue transition-all"
                />
              </div>

              <Dropdown>
                <DropdownTrigger>
                  <button className="rounded-full px-6 h-12 flex flex-row gap-2 items-center justify-between bg-lightgrey text-oceanblue hover:bg-smokygrey transition-colors min-w-[180px]">
                    <span className="font-medium text-14">
                      {sortOptions.find((o) => o.key === sortBy)?.label ||
                        'Sort by'}
                    </span>
                    <ArrowDropdown />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Sort options"
                  classNames={{
                    base: 'bg-fullwhite',
                    list: 'bg-fullwhite'
                  }}
                  onAction={(key) => setSortBy(key as SortOption)}
                >
                  {sortOptions.map((option) => (
                    <DropdownItem
                      key={option.key}
                      classNames={{
                        base:
                          sortBy === option.key
                            ? 'bg-lightgrey text-oceanblue font-medium data-[hover=true]:bg-lightgrey'
                            : 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                      }}
                    >
                      {option.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>

            {searchQuery && (
              <div className="w-full text-oceanblue text-14">
                {filteredAndSortedForums.length > 0 ? (
                  <p>
                    Found {filteredAndSortedForums.length} forum
                    {filteredAndSortedForums.length !== 1 ? 's' : ''} matching "
                    {searchQuery}"
                  </p>
                ) : (
                  <p className="text-darkgrey">
                    No forums found matching "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="space-y-8 w-full mb-[60px] lg:mb-[120px]">
          {/* General category */}
          {generalCategory && (
            <div key={generalCategory.forum_id} className="rounded-16">
              <div
                className={`flex ${pathname === '/forum' ? 'flex-col sm:flex-row items-start sm:items-center justify-between gap-8' : 'flex-col items-center'} mb-16 lg:mb-32 ${pathname !== '/forum' ? 'py-32 lg:py-64' : ''}`}
              >
                <h3
                  className={`text-20 lg:text-24 ${pathname === '/forum' ? 'text-oceanblue text-left' : 'text-fullwhite text-center'} font-medium`}
                >
                  {generalCategory.forum_name}
                </h3>
                {forumsByParent[generalCategory.forum_id] && (
                  <div
                    className={`flex gap-3 text-13 ${pathname !== '/forum' ? 'mt-3' : ''}`}
                  >
                    <span
                      className={`${pathname === '/forum' ? 'text-darkgrey' : 'text-fullwhite/70'}`}
                    >
                      {forumsByParent[generalCategory.forum_id].reduce(
                        (sum, f) => sum + f.topics,
                        0
                      )}{' '}
                      topics
                    </span>
                    <span
                      className={`${pathname === '/forum' ? 'text-darkgrey' : 'text-fullwhite/70'}`}
                    >
                      {forumsByParent[generalCategory.forum_id].reduce(
                        (sum, f) => sum + f.posts,
                        0
                      )}{' '}
                      posts
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 px-16 lg:px-32">
                {forumsByParent[generalCategory.forum_id]
                  ?.slice(
                    0,
                    pathname === '/forum'
                      ? forumsByParent[generalCategory.forum_id].length
                      : 3
                  )
                  .map(renderForumItem)}
              </div>
            </div>
          )}

          {/* Model categories */}
          <h2
            className={`text-18 !pt-9 sm:text-20 lg:text-24 font-medium text-center ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'}`}
          >
            Browse by model
          </h2>

          {/* Model filter buttons */}
          <div className="flex flex-row gap-2 lg:gap-3 flex-wrap w-full justify-center pt-32 lg:pt-64 pb-8 overflow-x-auto">
            {MODEL_FILTERS.map((model) => (
              <button
                key={model.key}
                onClick={() => setSelectedModel(model.key)}
                className={`px-4 lg:px-5 py-2 rounded-full text-12 lg:text-14 font-medium transition-all duration-200 border whitespace-nowrap ${
                  selectedModel === model.key
                    ? pathname === '/forum'
                      ? 'bg-oceanblue text-fullwhite border-oceanblue'
                      : 'bg-fullwhite text-oceanblue border-fullwhite'
                    : pathname === '/forum'
                      ? 'bg-transparent text-oceanblue border-oceanblue hover:bg-oceanblue/10'
                      : 'bg-transparent text-fullwhite border-fullwhite/50 hover:bg-fullwhite/10'
                }`}
              >
                {model.label}
              </button>
            ))}
          </div>

          {modelCategories
            .slice(0, pathname === '/forum' ? modelCategories.length : 1)
            .map((cat) => (
              <div key={cat.forum_id} className="rounded-16">
                <div
                  className={`flex ${pathname === '/forum' ? 'flex-col sm:flex-row items-start sm:items-center justify-between gap-8' : 'flex-col items-center'} mb-16 lg:mb-32 ${pathname !== '/forum' ? 'py-16' : ''}`}
                >
                  <h3
                    className={`text-20 lg:text-24 ${pathname === '/forum' ? 'text-oceanblue text-left' : 'text-fullwhite text-center'} font-medium`}
                  >
                    {cat.forum_name}
                  </h3>
                  {forumsByParent[cat.forum_id] && (
                    <div
                      className={`flex gap-3 text-13 ${pathname !== '/forum' ? 'mt-3' : ''}`}
                    >
                      <span
                        className={`${pathname === '/forum' ? 'text-darkgrey' : 'text-fullwhite/70'}`}
                      >
                        {forumsByParent[cat.forum_id].reduce(
                          (sum, f) => sum + f.topics,
                          0
                        )}{' '}
                        topics
                      </span>
                      <span
                        className={`${pathname === '/forum' ? 'text-darkgrey' : 'text-fullwhite/70'}`}
                      >
                        {forumsByParent[cat.forum_id].reduce(
                          (sum, f) => sum + f.posts,
                          0
                        )}{' '}
                        posts
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 px-16 lg:px-32">
                  {forumsByParent[cat.forum_id]
                    ?.slice(
                      0,
                      pathname === '/forum'
                        ? forumsByParent[cat.forum_id].length
                        : 3
                    )
                    .map(renderForumItem)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
