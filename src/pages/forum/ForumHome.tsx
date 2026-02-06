import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ForumUser } from '@/hooks/useForumAuth';
import { getRelativeTime } from '@/lib/timeUtils';

interface Topic {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_admin_only: boolean;
  thread_count: number;
  reply_count: number;
  last_thread_id: string | null;
  last_thread_title: string | null;
  last_post_at: string | null;
  last_poster_username: string | null;
  last_poster_id: string | null;
}

interface Section {
  header: string;
  topic_ids: string[];
}

interface OutletContext {
  user: any;
  forumUser: ForumUser | null;
  isAdmin: boolean;
}

export default function ForumHome() {
  const navigate = useNavigate();
  const { user, forumUser, isAdmin } = useOutletContext<OutletContext>();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [forumEnabled, setForumEnabled] = useState(true);

  const isLoggedIn = !!forumUser;

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    // Get all categories as topics
    const { data: categories } = await supabase
      .from('forum_categories')
      .select('*')
      .order('sort_order');

    if (categories) {
      // Build topics with counts
      const topicsWithData = await Promise.all(
        categories.map(async (cat) => {
          // Thread count
          const { count: threadCount } = await supabase
            .from('forum_threads')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
            .eq('is_deleted', false);

          // Get last thread
          const { data: lastThread } = await supabase
            .from('forum_threads')
            .select('id, title, last_post_at, last_post_by')
            .eq('category_id', cat.id)
            .eq('is_deleted', false)
            .order('last_post_at', { ascending: false })
            .limit(1)
            .single();

          let lastPoster = null;
          if (lastThread?.last_post_by) {
            const { data: poster } = await supabase
              .from('forum_users')
              .select('id, username')
              .eq('id', lastThread.last_post_by)
              .single();
            lastPoster = poster;
          }

          return {
            id: cat.id,
            name: cat.name,
            description: cat.description,
            slug: cat.slug,
            is_admin_only: cat.is_admin_only,
            thread_count: threadCount || 0,
            reply_count: 0,
            last_thread_id: lastThread?.id || null,
            last_thread_title: lastThread?.title || null,
            last_post_at: lastThread?.last_post_at || null,
            last_poster_username: lastPoster?.username || null,
            last_poster_id: lastPoster?.id || null,
          };
        })
      );

      setTopics(topicsWithData);

      // Create sections - one for regular topics, one for staff
      const regularTopics = topicsWithData.filter(t => !t.is_admin_only);
      const staffTopics = topicsWithData.filter(t => t.is_admin_only);

      const sectionsData: Section[] = [];
      if (regularTopics.length > 0) {
        sectionsData.push({
          header: 'BLOX City',
          topic_ids: regularTopics.map(t => t.id),
        });
      }
      if (staffTopics.length > 0 && isAdmin) {
        sectionsData.push({
          header: 'Staff',
          topic_ids: staffTopics.map(t => t.id),
        });
      }
      setSections(sectionsData);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white border border-[#ccc] rounded" />
        ))}
      </div>
    );
  }

  if (!forumEnabled) {
    return (
      <div className="container construction-container">
        <i className="icon icon-sad construction-icon"></i>
        <div className="construction-text">Sorry, the Forum is unavailable right now for maintenance. Try again later.</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.header}>
          {/* Section Header */}
          <div className="forum-header">
            <div className="grid-x grid-margin-x">
              <div className="cell medium-8">{section.header}</div>
              <div className="cell medium-1 text-center hide-for-small-only">Threads</div>
              <div className="cell medium-1 text-center hide-for-small-only">Replies</div>
              <div className="cell medium-2 text-right hide-for-small-only">Last Post</div>
            </div>
          </div>

          {/* Topics in Section */}
          {topics
            .filter((t) => section.topic_ids.includes(t.id))
            .map((topic) => (
              <div key={topic.id} className="forum-container">
                <div className="grid-x grid-margin-x align-middle">
                  <div className="cell medium-8">
                    <Link to={`/category/${topic.slug}`}>
                      <div className="forum-container-topic-name">{topic.name}</div>
                      <div className="forum-container-topic-description">{topic.description}</div>
                    </Link>
                  </div>
                  <div className="cell medium-1 text-center hide-for-small-only">
                    <div className="forum-container-stat">{topic.thread_count.toLocaleString()}</div>
                  </div>
                  <div className="cell medium-1 text-center hide-for-small-only">
                    <div className="forum-container-stat">{topic.reply_count.toLocaleString()}</div>
                  </div>
                  <div className="cell medium-2 text-right hide-for-small-only">
                    {topic.last_thread_id ? (
                      <>
                        <Link
                          to={`/thread/${topic.last_thread_id}`}
                          className="forum-container-stat forum-container-stat-last-post"
                        >
                          {topic.last_thread_title}
                        </Link>
                        <div className="forum-container-stat-last-poster">
                          by{' '}
                          <Link to={`/user/${topic.last_poster_username}`}>
                            {topic.last_poster_username}
                          </Link>
                          , {getRelativeTime(topic.last_post_at || '')}
                        </div>
                      </>
                    ) : (
                      <span className="forum-container-stat">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          <div style={{ marginBottom: 20 }}></div>
        </div>
      ))}
    </div>
  );
}
