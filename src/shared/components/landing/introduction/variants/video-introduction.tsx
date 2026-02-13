import type {
  IntroductionFeature,
  VideoIntroductionProps,
  VideoOptions,
} from "@/shared/types/landing"
import { ContentSection } from "../shared/content-section"
import { IntroductionLayout } from "../shared/introduction-layout"
import { VideoSection } from "../shared/video-section"

export const VideoIntroduction = ({ section }: VideoIntroductionProps) => {
  const features: IntroductionFeature[] = Object.entries(section.features || {}).map(
    ([key, feature]) => ({
      id: key,
      ...feature,
    })
  )

  const contentSection = (
    <ContentSection
      title={section.title}
      description={section.description}
      features={features}
    />
  )

  const finalVideoOptions: Required<VideoOptions> = {
    autoPlay: true,
    controls: false,
    loop: true,
    muted: true,
    ...section.videoOptions,
  }

  const mediaSection = (
    <VideoSection
      video={section.video}
      title={section.title}
      {...finalVideoOptions}
    />
  )

  return (
    <IntroductionLayout
      id={section.id}
      contentSection={contentSection}
      mediaSection={mediaSection}
      mediaPosition={section.videoPosition || "right"}
    />
  )
}
