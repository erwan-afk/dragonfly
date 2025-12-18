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
  forum_type: number; // 0 = catégorie, 1 = forum
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

export default function ForumSection() {
  const [forumData, setForumData] = useState<ForumData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
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

  // Séparer catégories et forums - TOUJOURS appeler les hooks
  const categories = forumData.filter((f) => f.forum_type === 0);

  // Filtrer et trier les forums - TOUJOURS appeler useMemo
  const filteredAndSortedForums = useMemo(() => {
    let forums = forumData.filter((f) => f.forum_type === 1);

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      forums = forums.filter(
        (f) =>
          f.forum_name.toLowerCase().includes(query) ||
          f.forum_desc.toLowerCase().includes(query) ||
          f.last_post_author?.toLowerCase().includes(query)
      );
    }

    // Trier
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

  // Regrouper par parent - TOUJOURS calculer
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

  // Conditions de rendu APRÈS tous les hooks
  if (loading) {
    return <section className="w-full py-16 max-w-screen-xl mx-auto"></section>;
  }

  if (error) {
    return <></>;
  }

  return (
    <section
      className={`w-full  ${pathname === '/forum' ? 'bg-fullwhite' : ' bg-gradient-to-b pt-[120px] from-articblue to-oceanblue'}`}
    >
      <div className="mx-auto max-w-screen-xl flex flex-col gap-64 items-center justify-center">
        {pathname !== '/forum' && (
          <>
            <div className="flex flex-col gap-32 items-center justify-center md:max-w-[800px] mx-auto ">
              <h2
                className={`text-48 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'}`}
              >
                Latest Forum Discussions
              </h2>
              <p
                className={`text-16 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'} text-center`}
              >
                Engage with fellow enthusiasts, share insights, and get answers
                to your questions about Dragonfly trimarans, maintenance,
                sailing tips, and more. For comprehensive discussions and to
                participate fully, please visit our main forum accessible here
                or via the navigation menu.
              </p>
              <div className="flex flex-row gap-32">
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

            {pathname === '/forum' && (
              <>
                {/* Barre de recherche et tri pour la homepage */}
                <div className="flex flex-row gap-4 items-center justify-between w-full">
                  {/* Barre de recherche */}
                  <div className="relative flex-1 max-w-[500px]">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-fullwhite"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search forums, topics, or authors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-full pl-12 pr-5 h-12 bg-oceanblue text-fullwhite placeholder:text-stonegrey focus:outline-none focus:ring-2 focus:ring-fullwhite transition-all"
                    />
                  </div>

                  {/* Dropdown tri */}
                  <Dropdown>
                    <DropdownTrigger>
                      <button className="rounded-full px-6 h-12 flex flex-row gap-2 items-center justify-between bg-oceanblue text-fullwhite hover:bg-fullwhite hover:text-oceanblue transition-colors min-w-[180px]">
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
              </>
            )}

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
            <div className="flex flex-row justify-between items-center w-full">
              <h1 className="text-oceanblue text-56">
                <span className="text-articblue">Topics</span>
              </h1>
              <p className="text-darkgrey w-1/2 text-16 font-light">
                Explore discussions, search for specific topics, and sort by
                activity. Join our community of Dragonfly enthusiasts and share
                your passion for sailing.
              </p>
            </div>

            {/* Barre de recherche et tri */}
            <div className="flex flex-row gap-4 items-center justify-between w-full">
              {/* Barre de recherche */}
              <div className="relative flex-1 max-w-[500px]">
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

              {/* Dropdown tri */}
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

            {/* Résultats de recherche */}
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

        <div className="space-y-8 w-full mb-[120px]">
          {categories
            .slice(0, pathname === '/forum' ? categories.length : 2)
            .map((cat) => (
              <div key={cat.forum_id} className=" rounded-16  ">
                <h3
                  className={`text-24 ${pathname === '/forum' ? 'text-oceanblue  text-left' : 'text-fullwhite text-center py-64'} font-medium  mb-32`}
                >
                  {cat.forum_name}
                </h3>

                <div className="flex flex-col gap-3 px-32">
                  {forumsByParent[cat.forum_id]
                    ?.slice(
                      0,
                      pathname === '/forum'
                        ? forumsByParent[cat.forum_id].length
                        : 3
                    )
                    .map((forum) => (
                      <a
                        key={forum.forum_id}
                        href={`https://www.dragonfly-trimarans.org/phpBB/viewforum.php?f=${forum.forum_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row justify-between items-center  gap-4 border-t-2 last:border-b-2 py-6  border-stonegrey group"
                      >
                        <div className="flex flex-col justify-between items-start gap-4">
                          <div className="flex flex-col justify-between items-start ">
                            {forum.last_post_time ? (
                              <div className="flex flex-row gap-4 items-center">
                                <p
                                  className={`text-12 ${pathname === '/forum' ? ' text-oceanblue' : 'text-fullwhite'}`}
                                >
                                  by {forum.last_post_author}
                                </p>
                                <p
                                  className={`text-12 ${pathname === '/forum' ? ' text-oceanblue' : 'text-fullwhite'}`}
                                >
                                  {new Date(
                                    forum.last_post_time * 1000
                                  ).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            ) : (
                              <p className="italic text-stonegrey">
                                No posts yet
                              </p>
                            )}
                            <div className="flex flex-row justify-between items-center">
                              <p
                                className={`text-32 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'} `}
                              >
                                {forum.forum_name}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`flex gap-4 mt-2 text-14 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'} `}
                          >
                            <span
                              className={` px-4 py-1 rounded-full ${pathname === '/forum' ? ' text-fullwhite bg-oceanblue' : 'text-oceanblue bg-fullwhite'}`}
                            >
                              {forum.topics} Topic
                              {forum.topics !== 1 ? 's' : ''}
                            </span>

                            <span
                              className={` px-4 py-1 rounded-full ${pathname === '/forum' ? ' text-fullwhite bg-oceanblue' : 'text-oceanblue bg-fullwhite'}`}
                            >
                              {forum.posts} Post{forum.posts !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-row justify-between items-center gap-4 max-w-[600px] pl-32">
                          <p
                            className={`text-16 ${pathname === '/forum' ? 'text-oceanblue' : 'text-fullwhite'} `}
                          >
                            {forum.forum_desc}
                          </p>

                          <div
                            className={`min-w-[60px]  h-fit py-2 flex justify-center 
                              ${pathname === '/forum' ? 'text-oceanblue bg-fullwhite' : 'text-fullwhite '} rounded-[75px] transition-all duration-300
                              ${pathname === '/forum' ? 'text-oceanblue bg-fullwhite group-hover:text-fullwhite group-hover:bg-oceanblue' : 'text-fullwhite  group-hover:text-oceanblue group-hover:bg-fullwhite'} rounded-[75px] transition-all duration-300 `}
                          >
                            <ArrowSeemore />
                          </div>
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
