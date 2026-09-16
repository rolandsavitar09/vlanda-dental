import { Hero } from '../../components/common/Hero'
import { Icon } from '../../components/common/Icon'
import type { Article, View } from '../../types'

type DetailArtikelProps = {
  article: Article
  navigate: (view: View) => void
  startReservation: () => void
}

export function DetailArtikel({ article, navigate, startReservation }: DetailArtikelProps) {
  return (
    <>
      <Hero
        copy="Baca informasi kesehatan gigi dari Vlanda Dental dengan bahasa yang mudah dipahami."
        startReservation={startReservation}
        title={
          <>
            Artikel
            <br />
            Kesehatan
            <br />
            Gigi
          </>
        }
      />

      <section className="content-section article-detail-page">
        <button className="text-button article-back-button" type="button" onClick={() => navigate('articles')}>
          <Icon name="arrow" /> Kembali ke Artikel
        </button>

        <article className="article-detail-card">
          {article.imageUrl ? (
            <img className="article-detail-image" src={article.imageUrl} alt={article.title} />
          ) : null}
          <div className="article-detail-content">
            <span>{article.category}</span>
            <h2>{article.title}</h2>
            <p className="article-date">
              <Icon name="calendar" />
              {article.date}
            </p>
            <p className="article-excerpt">{article.excerpt}</p>
            <div className="article-body">
              {article.content.split('\n').map((paragraph, index) => (
                <p key={`${article.id}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>
      </section>
    </>
  )
}
