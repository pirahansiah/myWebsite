#!/usr/bin/env ruby
# frozen_string_literal: true

# Parse Obsidian-style MOC (contents/site.md) → _data/nav.yml + assets/site-map.md
# Run before Jekyll build (see run.sh). No gem plugins required.

require "cgi"
require "json"
require "yaml"
require "fileutils"

ROOT = File.expand_path("..", __dir__)
SITE_MD = File.join(ROOT, "contents", "menus.md")
OUT_YML = File.join(ROOT, "_data", "nav.yml")
OUT_ASSET = File.join(ROOT, "assets", "site-map.md")
OUT_GRAPH = File.join(ROOT, "assets", "graph.json")
OUT_HASHTAG_GRAPH = File.join(ROOT, "assets", "graph-hashtags.json")

def strip_front_matter(text)
  return text unless text.start_with?("---\n")

  text.sub(/\A---\s*\n.*?\n---\s*\n/m, "")
end

def file_extension?(path)
  path.match?(%r{\.[a-z0-9]{2,5}\z}i)
end

def content_url_for_path(path)
  rel = path.sub("#{ROOT}/", "")
  rel = rel.sub(/\.md\z/i, "")
  url = "/#{rel}"
  url.sub(%r{\A/[Cc]ontents}, "/contents")
end

def wiki_index
  @wiki_index ||= begin
    idx = {}
    Dir.glob(File.join(ROOT, "contents", "**", "*")).each do |path|
      next unless File.file?(path)
      next if File.basename(path) == "site.md"

      base = File.basename(path, File.extname(path))
      rel = path.sub("#{ROOT}/", "")
      raw = content_url_for_path(path)
      idx[base.downcase] = raw
      idx[rel.downcase] = raw
      idx[rel.sub(/contents/i, "contents").downcase] = raw
      idx[rel.sub(/\.(md|html?)\z/i, "").downcase] = raw
    end
    idx
  end
end

def normalize_url(url)
  return url if url.nil? || url.empty?
  return url if url.match?(%r{\A(https?:|#|mailto:)}i)

  url = url.strip
  url = url.sub(%r{\A\./}, "/contents/")
  url = "/#{url}" unless url.start_with?("/")
  url = url.sub(/\.md\z/i, "") unless file_extension?(url)

  return url if file_extension?(url)

  url
end

# Static assets (html, pdf, code, …) open in /view/ so site menu + CSS stay visible.
VIEWER_EXTENSIONS = %w[
  html htm pdf doc docx xls xlsx ppt pptx zip
  py cpp c cc h hpp hh java js ts jsx tsx go rs rb php swift kt cs
  sh bash zsh sql r m mm yaml yml toml xml css scss txt csv
  png jpg jpeg gif webp svg bmp ico mp4 webm
].freeze

def canonical_asset_path(url)
  rel = url.to_s.sub(%r{\A/}, "").split("?").first
  direct = File.join(ROOT, rel)
  return "/#{rel}" if File.file?(direct)

  base = File.basename(rel)
  Dir.glob(File.join(ROOT, "**", base)).each do |found|
    next if File.basename(found) == "site.md"

    candidate = "/#{found.sub("#{ROOT}/", "")}"
    return candidate if candidate.downcase == "/#{rel}".downcase
  end

  "/#{rel}"
end

def viewer_extension?(url)
  ext = File.extname(url.to_s.split("?").first).delete_prefix(".").downcase
  !ext.empty? && VIEWER_EXTENSIONS.include?(ext)
end

def menu_url(url)
  return url if url.nil? || url.empty?
  return url if url.match?(%r{\A(https?:|#|mailto:)}i)
  return url if url.start_with?("/view/")

  raw = canonical_asset_path(normalize_url(url))
  return raw unless viewer_extension?(raw)

  "/view/?p=#{CGI.escape(raw)}"
end

def parse_inline(text)
  text = text.to_s.strip
  return { title: "", url: nil } if text.empty?

  if (m = text.match(/\A\[(.+?)\]\((.+?)\)\z/))
    return { title: m[1], url: menu_url(m[2]) }
  end

  if (m = text.match(/\A\[\[(.+?)\|(.+?)\]\]\z/))
    return { title: m[2].strip, url: menu_url(resolve_wiki_raw(m[1].strip)) }
  end

  if (m = text.match(/\A\[\[(.+?)\]\]\z/))
    ref = m[1]
    if ref.include?("|")
      path, label = ref.split("|", 2)
      return { title: label.strip, url: menu_url(resolve_wiki_raw(path.strip)) }
    end
    return { title: ref, url: menu_url(resolve_wiki_raw(ref)) }
  end

  { title: text, url: nil }
end

def resolve_wiki_raw(ref)
  ref = ref.sub(/\.md\z/i, "")
  key = File.basename(ref).downcase
  found = wiki_index[key] || wiki_index[ref.downcase]
  return canonical_asset_path(found) if found

  canonical_asset_path(normalize_url("/contents/#{ref}"))
end

def attach_link_to_heading(ctx, title, url)
  heading = ctx[:last_heading]
  return unless heading
  return unless ctx[:last_heading_level] && ctx[:last_heading_level] >= 1
  return if heading["url"]

  heading["url"] = url
  heading["title"] = title if heading["title"].to_s.empty?
end

# Menu rules (Obsidian MOC):
#   #       → page title (skipped for menu)
#   ##      → level 1 top menu items
#   ###     → submenu under their parent ##
#   links on the line after ##/### attach to that heading (not separate menu items)
#   lists, tasks, and other lines are ignored for the menu (still in site-map body)
def parse_moc(text)
  menu = []
  ctx = {
    h1: nil,
    h2: nil,
    h3: nil,
    last_heading: nil,
    last_heading_level: nil
  }

  strip_front_matter(text).each_line do |raw|
    stripped = raw.strip
    next if stripped.empty? || stripped == "[]"

    if (m = stripped.match(/\A(#+)\s+(.+)\z/))
      level = m[1].length
      next unless [1, 2, 3].include?(level)

      info = parse_inline(m[2])
      node = { "title" => info[:title], "items" => [] }
      node["url"] = info[:url] if info[:url]

      case level
      when 1
        ctx[:h1] = node
        ctx[:h2] = ctx[:h3] = nil
      when 2
        menu << node
        ctx[:h2] = node
        ctx[:h3] = nil
      when 3
        parent = ctx[:h2]
        if parent
          parent["items"] << node
        else
          menu << node
        end
        ctx[:h3] = node
      end

      ctx[:last_heading] = node
      ctx[:last_heading_level] = level
      next
    end

    next unless stripped.match?(/\A(- \[.+\]\(.+\)|\[.+\]\(.+\)|\[\[.+\]\])\z/)

    if (m = stripped.match(/\A-\s*\[(.+?)\]\((.+?)\)\z/))
      child = { "title" => m[1], "items" => [] }
      child["url"] = menu_url(m[2])
      parent = ctx[:h2] || ctx[:h1]
      parent["items"] << child if parent
      next
    end

    if (m = stripped.match(/\A\[(.+?)\]\((.+?)\)\z/))
      attach_link_to_heading(ctx, m[1], menu_url(m[2]))
      next
    end

    if stripped.match?(/\A\[\[.+?\]\]\z/)
      info = parse_inline(stripped)
      attach_link_to_heading(ctx, info[:title], info[:url])
    end
  end

  menu
end

def slug_id(text)
  text.to_s.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/^-|-$/, "")
end

def node_id_for_path(path)
  rel = path.to_s.sub(%r{\A/}, "")
  rel = rel.sub(%r{/\z}, "") unless file_extension?(rel)
  rel = rel.sub(/\.(md|html?)\z/i, "")
  slug_id(rel.tr("/", "-"))
end

def url_to_node_id(url)
  return nil if url.nil? || url.empty?

  node_id_for_path(url)
end

def graph_label_for_url(url)
  raw = raw_path_from_url(url) || url.to_s
  base = File.basename(raw.split("?").first)
  base = File.basename(base, File.extname(base)) if file_extension?(base)
  base
end

def raw_path_from_url(url)
  return nil if url.nil? || url.empty?

  if url.start_with?("/view/")
    query = url.split("?", 2)[1]
    return nil unless query

    parsed = CGI.parse(query)
    path = parsed["p"]&.first || parsed["path"]&.first
    return CGI.unescape(path) if path && !path.empty?
    return nil
  end

  return url if url.match?(%r{\A/contents/}i)

  nil
end

def extract_links_from_markdown(text, source_id)
  links = []
  text = text.to_s.encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
  text.scan(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/) do |ref, _label|
    raw = resolve_wiki_raw(ref.strip)
    tid = url_to_node_id(raw)
    links << { "source" => source_id, "target" => tid, "kind" => "wiki", "url" => menu_url(raw), "raw" => raw } if tid
  end

  text.scan(/\[([^\]]+)\]\(([^)]+)\)/) do |_label, href|
    next if href.match?(%r{\A(https?:|#|mailto:)}i)

    raw = canonical_asset_path(normalize_url(href))
    tid = url_to_node_id(raw)
    links << { "source" => source_id, "target" => tid, "kind" => "mdlink", "url" => menu_url(raw), "raw" => raw } if tid
  end

  links
end

def extract_hashtags(text)
  return [] unless text
  raw = text.to_s.scan(/(?:^|[\s\(\[\{])#([A-Za-z][A-Za-z0-9_-]*)/).flatten.uniq
  raw.select do |tag|
    next false if tag.length < 3
    next false if tag.length > 30
    next false if tag.match?(/\A[0-9a-fA-F]{3,8}\z/)
    next false if tag.match?(/\A[A-Z]{2,}\z/)
    next false if tag.match?(/\A[0-9]+\z/)
    next false if tag.match?(/\A[a-z]+[0-9]+\z/)
    next false if tag.match?(/[0-9][A-Z]/)
    next false if tag.count("A-Z") > tag.length * 0.3
    true
  end
end

def build_hashtag_graph
  nodes = {}
  links = []
  seen_links = {}

  add_node = lambda do |id, label|
    nodes[id] ||= { "id" => id, "label" => label, "kind" => "tag" }
  end

  Dir.glob(File.join(ROOT, "contents", "**", "*.md")).each do |path|
    next unless File.file?(path)

    body = File.read(path, encoding: "UTF-8").scrub("")
    body = strip_front_matter(body)
    tags = extract_hashtags(body)
    next if tags.empty?

    file_id = node_id_for_path(path.sub("#{ROOT}/", ""))
    tag_ids = tags.map { |tag| "tag-#{slug_id(tag)}" }
    tags.each_with_index do |tag, index|
      add_node.call(tag_ids[index], "##{tag}")
      links << { "source" => file_id, "target" => tag_ids[index], "kind" => "tag" } unless links.any? { |l| l["source"] == file_id && l["target"] == tag_ids[index] }
    end

    tag_ids.combination(2).each do |source, target|
      next if source == target
      key = [source, target].sort.join("|")
      next if seen_links[key]

      seen_links[key] = true
      links << { "source" => source, "target" => target, "kind" => "cooccur" }
    end
  end

  { "nodes" => nodes.values, "links" => links }
end

def build_graph(nav, hashtag_mode: false)
  nodes = {}
  links = []
  seen_links = {}

  add_link = lambda do |source, target, kind|
    next if source.nil? || target.nil? || source == target

    key = [source, target, kind].join("|")
    return if seen_links[key]

    seen_links[key] = true
    links << { "source" => source, "target" => target, "kind" => kind }
  end

  add_node = lambda do |id, label, url: nil, raw: nil, kind: "note"|
    entry = { "id" => id, "label" => label, "url" => url, "raw" => raw, "kind" => kind }
    nodes[id] = entry unless nodes[id]
  end

  walk_nav = nil
  walk_nav = lambda do |items, parent_id|
    items.each do |item|
      id = "moc-#{slug_id(item['title'])}"
      raw = raw_path_from_url(item["url"])
      add_node.call(id, item["title"], url: item["url"], raw: raw, kind: "moc")
      add_link.call(parent_id, id, "moc") if parent_id

      if item["url"] && raw
        file_id = url_to_node_id(raw)
        if file_id && file_id != id
          add_node.call(
            file_id,
            graph_label_for_url(raw),
            url: item["url"],
            raw: raw,
            kind: "note"
          )
          add_link.call(id, file_id, "link")
        end
      end

      walk_nav.call(item["items"] || [], id)
    end
  end

  walk_nav.call(nav, nil)

  Dir.glob(File.join(ROOT, "contents", "**", "*.md")).each do |path|
    next unless File.file?(path)

    rel = path.sub("#{ROOT}/", "")
    id = node_id_for_path(rel)
    label = File.basename(path, File.extname(path))
    raw = content_url_for_path(path)
    add_node.call(id, label, url: menu_url(raw), raw: raw, kind: "note")

    body = File.read(path, encoding: "UTF-8").scrub("")
    body = strip_front_matter(body)

    extract_hashtags(body).each do |tag|
      tag_id = "tag-#{slug_id(tag)}"
      tag_url = menu_url(raw)
      add_node.call(tag_id, "##{tag}", url: tag_url, raw: raw, kind: "tag")
      add_link.call(id, tag_id, "tag")
    end

    extract_links_from_markdown(body, id).each do |link|
      add_link.call(link["source"], link["target"], link["kind"])
      next if nodes[link["target"]]

      add_node.call(
        link["target"],
        graph_label_for_url(link["raw"] || link["url"]),
        url: link["url"],
        raw: link["raw"],
        kind: "note"
      )
    end
  end

  { "nodes" => nodes.values, "links" => links }
end

unless File.file?(SITE_MD)
  warn "Missing #{SITE_MD} — writing empty nav."
  FileUtils.mkdir_p(File.dirname(OUT_YML))
  File.write(OUT_YML, "---\n[]\n")
  FileUtils.mkdir_p(File.dirname(OUT_ASSET))
  File.write(OUT_ASSET, "")
  File.write(OUT_GRAPH, JSON.pretty_generate({ "nodes" => [], "links" => [] }))
  exit 0
end

source = File.read(SITE_MD, encoding: "UTF-8").scrub("")
nav = parse_moc(source)

FileUtils.mkdir_p(File.dirname(OUT_YML))
File.write(OUT_YML, nav.to_yaml)

FileUtils.mkdir_p(File.dirname(OUT_ASSET))
File.write(OUT_ASSET, source)

graph = build_graph(nav)
hashtag_graph = build_hashtag_graph
FileUtils.mkdir_p(File.dirname(OUT_GRAPH))
File.write(OUT_GRAPH, JSON.pretty_generate(graph))
FileUtils.mkdir_p(File.dirname(OUT_HASHTAG_GRAPH))
File.write(OUT_HASHTAG_GRAPH, JSON.pretty_generate(hashtag_graph))

puts "Wrote #{nav.length} top-level nav items → #{OUT_YML}"
puts "Copied site map → #{OUT_ASSET}"
puts "Wrote graph (#{graph['nodes'].length} nodes, #{graph['links'].length} links) → #{OUT_GRAPH}"
puts "Wrote hashtag graph (#{hashtag_graph['nodes'].length} nodes, #{hashtag_graph['links'].length} links) → #{OUT_HASHTAG_GRAPH}"
