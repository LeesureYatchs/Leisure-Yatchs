import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO = ({
  title = "LeisureYacht - Luxury Yacht Rental Dubai",
  description = "Experience the ultimate luxury with LeisureYacht. Premium yacht rentals in Dubai Marina for parties, events, and cruises. Book your private yacht today!",
  keywords = "yacht rental dubai, luxury yacht charter, boat rental dubai, dubai marina yacht, private yacht dubai, party yacht rental",
  image = "/leisureyacht.png", 
  url = "https://www.theleisureyacht.com",
  type = "website"
}: SEOProps) => {
  const siteTitle = title.includes("LeisureYacht") ? title : `${title} | LeisureYacht Dubai`;
  const fullUrl = url.startsWith("http") ? url : `https://www.theleisureyacht.com${url}`;
  const fullImage = image.startsWith("http") ? image : `https://www.theleisureyacht.com${image}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="LeisureYacht Dubai" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="author" content="LeisureYacht" />
    </Helmet>
  );
};
