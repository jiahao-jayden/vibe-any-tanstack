import { useIntlayer } from "react-intlayer"
import { ImageIntroduction } from "./variants/image-introduction"
import { VideoIntroduction } from "./variants/video-introduction"

/**
 * IntroductionSections - Renders multiple introduction sections
 * with dynamic type-based component selection
 */
export const Introduction = () => {
  const { introduction } = useIntlayer("landing")

  return (
    <section
      id="introduction"
      aria-label="Introduction sections"
    >
      {introduction.map((item, index) => {
        const section = {
          id: `${index}`,
          type: item.type.value,
          title: item.title.value,
          description: item.description.value,
          image: typeof item.image === "string" ? item.image : item.image.value,
          imagePosition: item.imagePosition.value,
          features: item.features.map((f, i) => ({
            id: `${i}`,
            title: f.title.value,
            description: f.description.value,
          })),
        }

        if (section.type === "image") {
          return (
            <ImageIntroduction
              key={section.id}
              section={section}
            />
          )
        }
        if (section.type === "video") {
          return (
            <VideoIntroduction
              key={section.id}
              section={section as any}
            />
          )
        }
        return null
      })}
    </section>
  )
}
