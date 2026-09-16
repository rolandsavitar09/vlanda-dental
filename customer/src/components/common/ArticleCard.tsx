import type { Article } from '../../types'
import { Icon } from './Icon'

type ArticleCardProps = {
  article: Article
  onOpen: (articleId: string) => void
}

export function ArticleCard({ article, onOpen }: ArticleCardProps) {
  return (
    <button className="article-card" type="button" onClick={() => onOpen(article.id)}>
      <div className="article-thumb">
        {article.imageUrl ? <img src={article.imageUrl} alt="" /> : <Icon name="tooth" />}
      </div>
      <div>
        <span>{article.category}</span>
        <h3>{article.title}</h3>
        <p className="article-date">
          <Icon name="calendar" />
          {article.date}
        </p>
        <p>{article.excerpt}</p>
      </div>
    </button>
  )
}
