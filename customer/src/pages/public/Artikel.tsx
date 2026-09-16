import { ArticleCard } from '../../components/common/ArticleCard'
import { Hero } from '../../components/common/Hero'
import { articleCategories } from '../../data/articles'
import type { Article } from '../../types'

type ArtikelProps = {
  activeCategory: string
  articles: Article[]
  openArticleDetail: (articleId: string) => void
  search: string
  setActiveCategory: (category: string) => void
  setSearch: (search: string) => void
  startReservation: () => void
}

export function Artikel({
  activeCategory,
  articles,
  openArticleDetail,
  search,
  setActiveCategory,
  setSearch,
  startReservation,
}: ArtikelProps) {
  const query = search.trim().toLowerCase()
  const categories = ['Semua', ...Array.from(new Set(articles.map((article) => article.category)))]
  const filteredArticles = articles.filter((article) => {
    const matchCategory = activeCategory === 'Semua' || article.category === activeCategory
    const matchSearch =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query)
    return matchCategory && matchSearch
  })

  return (
    <>
      <Hero
        copy="Temukan tips perawatan gigi dan informasi kesehatan mulut yang mudah dipahami untuk keluarga."
        startReservation={startReservation}
        title={
          <>
            Artikel Kesehatan
            <br />
            Gigi Untuk
            <br />
            Senyum Sehat
          </>
        }
      />
      <section className="content-section">
        <div className="article-toolbar">
          <div className="tabs" aria-label="Kategori artikel">
            {(categories.length > 1 ? categories : articleCategories).map((category) => (
              <button
                className={activeCategory === category ? 'active' : ''}
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="search-box">
            <span>Cari artikel</span>
            <input
              type="search"
              placeholder="Cari artikel..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="article-grid">
          {filteredArticles.length === 0 ? (
            <p className="empty-state">Belum ada artikel yang sesuai.</p>
          ) : null}
          {filteredArticles.map((article) => (
            <ArticleCard article={article} key={article.id} onOpen={openArticleDetail} />
          ))}
        </div>
      </section>
    </>
  )
}
