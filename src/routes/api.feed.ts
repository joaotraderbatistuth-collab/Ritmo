import { createFileRoute } from '@tanstack/react-router';
import { requireMember, communityError } from '../lib/community-auth.js';
import { addComment, createPost, deleteComment, deletePost, listComments, listPosts, reportContent, toggleFollow, toggleLike, CommunityError } from '../lib/community-db.js';

export const Route = createFileRoute('/api/feed')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const q = new URL(request.url).searchParams;
          const commentsOf = q.get('comments');
          if (commentsOf) return Response.json({ comments: await listComments(user.id, Number(commentsOf)) });
          const teamId = q.get('teamId') ? Number(q.get('teamId')) : null;
          const before = q.get('before') ? Number(q.get('before')) : undefined;
          const data = await listPosts(user.id, { teamId, beforeId: before, limit: Number(q.get('limit')) || 20, following: q.get('following') === '1' });
          return Response.json(data);
        } catch (e) {
          return communityError(e);
        }
      },

      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json();
          switch (body.action) {
            case 'create_post': {
              const post = await createPost(user.id, { body: body.body, teamId: body.teamId, achievement: body.achievement, imageUrl: body.imageUrl });
              return Response.json({ success: true, message: 'Publicado!', postId: post.id });
            }
            case 'delete_post':
              await deletePost(user.id, Number(body.postId));
              return Response.json({ success: true, message: 'Publicação excluída.' });
            case 'toggle_follow':
              return Response.json({ success: true, ...(await toggleFollow(user.id, Number(body.userId))) });
            case 'toggle_like':
              return Response.json({ success: true, ...(await toggleLike(user.id, Number(body.postId))) });
            case 'add_comment': {
              const c = await addComment(user.id, Number(body.postId), body.body, body.imageUrl);
              return Response.json({ success: true, commentId: c.id });
            }
            case 'delete_comment':
              await deleteComment(user.id, Number(body.commentId));
              return Response.json({ success: true, message: 'Comentário excluído.' });
            case 'report': {
              const r = await reportContent(user.id, String(body.targetType), Number(body.targetId), body.reason);
              return Response.json({ success: true, message: 'Denúncia enviada. Obrigado por ajudar a manter o Feed seguro.', hidden: r.hidden });
            }
            default:
              throw new CommunityError(400, 'Ação não reconhecida.');
          }
        } catch (e) {
          return communityError(e);
        }
      },
    },
  },
});
