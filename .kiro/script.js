let slides = [];
let currentSlideIndex = 0;
let currentTheme = 'modern';

// DOM Elements - will be initialized after DOM loads
let inputSection, presentationSection, contentInput, themeSelect;
let generateBtn, backBtn, prevBtn, nextBtn, exportBtn, exportMenu;
let slidesContainer, currentSlideSpan, totalSlidesSpan;

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    inputSection = document.getElementById('inputSection');
    presentationSection = document.getElementById('presentationSection');
    contentInput = document.getElementById('contentInput');
    themeSelect = document.getElementById('themeSelect');
    generateBtn = document.getElementById('generateBtn');
    backBtn = document.getElementById('backBtn');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    exportBtn = document.getElementById('exportBtn');
    exportMenu = document.getElementById('exportMenu');
    slidesContainer = document.getElementById('slidesContainer');
    currentSlideSpan = document.getElementById('currentSlide');
    totalSlidesSpan = document.getElementById('totalSlides');

    // Event Listeners
    generateBtn.addEventListener('click', generatePresentation);
    backBtn.addEventListener('click', backToEdit);
    prevBtn.addEventListener('click', previousSlide);
    nextBtn.addEventListener('click', nextSlide);
    exportBtn.addEventListener('click', toggleExportMenu);
    themeSelect.addEventListener('change', (e) => {
        currentTheme = e.target.value;
    });

    // Export menu options
    exportMenu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const format = e.target.dataset.format;
            handleExport(format);
            exportMenu.classList.remove('show');
        });
    });

    // Close export menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
            exportMenu.classList.remove('show');
        }
    });

    // Template upload handler
    const templateUpload = document.getElementById('templateUpload');
    templateUpload.addEventListener('change', handleTemplateUpload);

    // Image helper modal
    const imageHelperBtn = document.getElementById('imageHelperBtn');
    const imageHelperModal = document.getElementById('imageHelperModal');
    const closeModal = document.getElementById('closeModal');
    
    imageHelperBtn.addEventListener('click', () => {
        imageHelperModal.classList.remove('hidden');
    });
    
    closeModal.addEventListener('click', () => {
        imageHelperModal.classList.add('hidden');
    });
    
    imageHelperModal.addEventListener('click', (e) => {
        if (e.target === imageHelperModal) {
            imageHelperModal.classList.add('hidden');
        }
    });

    // Load sample content
    loadSampleContent();
});

function loadSampleContent() {
    contentInput.value = `Welcome to QuickSlides
Create beautiful presentations in seconds

---

WHY QUICKSLIDES?
Smart Content Detection

- Automatically detects titles and headings
- Recognizes bullet points and lists
- Adds colors to subtopics
- Easy image integration

---

HOW TO ADD IMAGES
Click "Find Images" button for help!

You can paste image URLs directly in your content
Or select "Random Images" for placeholder images

---

GET STARTED
Try it now!

Just paste your content and watch the magic happen. Export as PDF, PowerPoint, or HTML when done!`;
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (presentationSection.classList.contains('hidden')) return;
    
    if (e.key === 'ArrowLeft') previousSlide();
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'Escape') backToEdit();
});

function parseContent(content) {
    // Auto-detect slide breaks or create them intelligently
    let slideTexts;
    
    if (content.includes('---')) {
        slideTexts = content.split('---').map(s => s.trim()).filter(s => s);
    } else {
        // Intelligent slide detection based on content structure
        slideTexts = autoDetectSlides(content);
    }
    
    return slideTexts.map(slideText => {
        const lines = slideText.split('\n').map(l => l.trim()).filter(l => l);
        const slide = {
            title: '',
            subtitle: '',
            bullets: [],
            images: []
        };
        
        lines.forEach(line => {
            // Check for image URLs first
            if (isImageUrl(line)) {
                console.log('✓ Detected image URL:', line);
                slide.images.push(line);
            }
            // Check for markdown headers (remove # symbols)
            else if (line.startsWith('## ')) {
                slide.subtitle = line.substring(3).trim();
                console.log('Detected subtitle:', slide.subtitle);
            } 
            else if (line.startsWith('#')) {
                slide.title = line.replace(/^#+\s*/, '').trim();
                console.log('Detected title (markdown):', slide.title);
            }
            // Check for bullet points
            else if (line.match(/^[\-\*\•\d+\.]\s/)) {
                slide.bullets.push(line.replace(/^[\-\*\•\d+\.]\s*/, '').trim());
            }
            // Auto-detect titles - first non-empty line becomes title if no title yet
            else if (!slide.title && line.length > 0) {
                slide.title = line.replace(/:$/, '').trim();
                console.log('Auto-detected title:', slide.title);
            }
            // Auto-detect subtitles (after title, not too long, not a URL)
            else if (slide.title && !slide.subtitle && line.length < 100 && !line.startsWith('http') && slide.bullets.length === 0) {
                slide.subtitle = line;
                console.log('Auto-detected subtitle:', slide.subtitle);
            }
            // Everything else becomes a bullet point (but not URLs)
            else if (line && !line.startsWith('http')) {
                slide.bullets.push(line);
            }
        });
        
        return slide;
    });
}

function autoDetectSlides(content) {
    const lines = content.split('\n');
    const slides = [];
    let currentSlide = [];
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Start new slide on major headers or after empty lines with new content
        if (trimmed.startsWith('#') && currentSlide.length > 0) {
            slides.push(currentSlide.join('\n'));
            currentSlide = [line];
        } else if (trimmed) {
            currentSlide.push(line);
        } else if (currentSlide.length > 0 && lines[index + 1]?.trim()) {
            // Empty line followed by content might indicate new slide
            const nextLine = lines[index + 1].trim();
            if (nextLine.length < 60 || nextLine.startsWith('#')) {
                slides.push(currentSlide.join('\n'));
                currentSlide = [];
            }
        }
    });
    
    if (currentSlide.length > 0) {
        slides.push(currentSlide.join('\n'));
    }
    
    // If we only got one slide, try to split by paragraphs
    if (slides.length === 1) {
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
        if (paragraphs.length > 1) {
            return paragraphs;
        }
    }
    
    return slides.length > 0 ? slides : [content];
}

function isImageUrl(text) {
    // Check if it's a URL
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(text)) return false;
    
    // Check for image extensions
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i;
    if (imageExtensions.test(text)) return true;
    
    // Check for common image hosting domains
    const imageHosts = [
        'images.unsplash.com',
        'unsplash.com',
        'images.pexels.com',
        'pexels.com',
        'pixabay.com',
        'picsum.photos',
        'imgur.com',
        'i.imgur.com',
        'flickr.com',
        'staticflickr.com'
    ];
    
    return imageHosts.some(host => text.includes(host));
}

function createSlideElement(slideData, index) {
    const slideDiv = document.createElement('div');
    slideDiv.className = `slide theme-${currentTheme}`;
    slideDiv.dataset.index = index;
    
    // Get image position preference
    const imagePosition = document.getElementById('imagePosition').value;
    if (slideData.images && slideData.images.length > 0) {
        slideDiv.classList.add(`img-${imagePosition}`);
    }
    
    if (slideData.title) {
        const title = document.createElement('h1');
        title.textContent = slideData.title;
        slideDiv.appendChild(title);
    }
    
    if (slideData.subtitle) {
        const subtitle = document.createElement('h2');
        subtitle.textContent = slideData.subtitle;
        slideDiv.appendChild(subtitle);
    }
    
    // Add images if present
    if (slideData.images && slideData.images.length > 0) {
        console.log(`Creating slide ${index + 1} with ${slideData.images.length} images`);
        slideData.images.forEach(imgUrl => {
            if (imagePosition === 'background') {
                // Set as background image
                slideDiv.style.backgroundImage = `url('${imgUrl}')`;
                slideDiv.style.backgroundSize = 'cover';
                slideDiv.style.backgroundPosition = 'center';
            } else {
                // Add as img element
                const img = document.createElement('img');
                img.src = imgUrl;
                img.alt = 'Slide image';
                img.onload = () => console.log(`Image loaded successfully: ${imgUrl}`);
                img.onerror = () => {
                    console.error(`Image failed to load: ${imgUrl}`);
                    img.style.display = 'none';
                };
                slideDiv.appendChild(img);
                console.log(`Added image to slide: ${imgUrl}`);
            }
        });
    } else {
        console.log(`Slide ${index + 1} has no images`);
    }
    
    if (slideData.bullets.length > 0) {
        const ul = document.createElement('ul');
        slideData.bullets.forEach(bullet => {
            const li = document.createElement('li');
            li.textContent = bullet;
            ul.appendChild(li);
        });
        slideDiv.appendChild(ul);
    }
    
    return slideDiv;
}

async function generatePresentation() {
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('Please enter some content first!');
        return;
    }
    
    slides = parseContent(content);
    
    if (slides.length === 0) {
        alert('Could not parse content. Try adding some text!');
        return;
    }
    
    // Add auto images if enabled
    const imageSource = document.getElementById('imageSource').value;
    if (imageSource === 'random') {
        await addAutoImages();
    }
    
    // Clear previous slides
    slidesContainer.innerHTML = '';
    
    // Create slide elements
    slides.forEach((slideData, index) => {
        const slideElement = createSlideElement(slideData, index);
        slidesContainer.appendChild(slideElement);
    });
    
    // Show presentation
    currentSlideIndex = 0;
    updateSlideDisplay();
    inputSection.classList.add('hidden');
    presentationSection.classList.remove('hidden');
}

async function addAutoImages() {
    console.log('Adding random images');
    console.log('Number of slides:', slides.length);
    
    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        
        // Initialize images array if it doesn't exist
        if (!slide.images) {
            slide.images = [];
        }
        
        // Skip if slide already has images
        if (slide.images.length > 0) {
            console.log(`Slide ${i + 1} already has images, skipping`);
            continue;
        }
        
        // Get keywords from title, subtitle, and bullets
        const allText = [
            slide.title || '',
            slide.subtitle || '',
            ...(slide.bullets || []).slice(0, 2)
        ].join(' ').toLowerCase();
        
        // Extract meaningful keywords (remove common words)
        const commonWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will', 'your', 'our', 'are', 'can', 'how', 'what', 'why', 'when'];
        const keywords = allText
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !commonWords.includes(word))
            .slice(0, 2)
            .join(' ');
        
        const query = keywords || 'abstract';
        
        try {
            let imageUrl;
            
            switch(imageSource) {
                case 'unsplash':
                    // Use Picsum with seed for consistency
                    imageUrl = `https://picsum.photos/seed/${encodeURIComponent(query)}-${i}/800/450`;
                    break;
                    
                case 'pexels':
                    // Use Picsum with different seed
                    imageUrl = `https://picsum.photos/seed/pexels-${query}-${i}/800/450`;
                    break;
                    
                case 'pixabay':
                    // Use Picsum with another seed
                    imageUrl = `https://picsum.photos/seed/pixabay-${query}-${i}/800/450`;
                    break;
                    
                default:
                    imageUrl = `https://picsum.photos/seed/${Date.now() + i}/800/450`;
            }
            
            slide.images = [imageUrl];
            console.log(`Slide ${i + 1}: "${slide.title}" - Keywords: "${query}" - Image: ${imageUrl}`);
            
        } catch (error) {
            console.log('Could not fetch image:', error);
            slide.images = [`https://picsum.photos/800/450?random=${i + Date.now()}`];
        }
    }
    
    console.log('Finished adding images. Slides with images:', slides.filter(s => s.images && s.images.length > 0).length);
}

function handleTemplateUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    const reader = new FileReader();
    
    if (fileName.endsWith('.css')) {
        // Handle CSS template
        reader.onload = function(e) {
            const cssContent = e.target.result;
            
            let customStyle = document.getElementById('customTemplateStyle');
            if (!customStyle) {
                customStyle = document.createElement('style');
                customStyle.id = 'customTemplateStyle';
                document.head.appendChild(customStyle);
            }
            
            customStyle.textContent = cssContent;
            themeSelect.value = 'custom';
            currentTheme = 'custom';
            
            alert('CSS template loaded successfully! Generate slides to see the changes.');
        };
        reader.readAsText(file);
        
    } else if (fileName.endsWith('.json')) {
        // Handle JSON template
        reader.onload = function(e) {
            try {
                const template = JSON.parse(e.target.result);
                applyJsonTemplate(template);
                alert('JSON template loaded successfully! Generate slides to see the changes.');
            } catch (error) {
                alert('Invalid JSON file. Please check the format.');
            }
        };
        reader.readAsText(file);
        
    } else if (fileType.startsWith('image/')) {
        // Handle background image
        reader.onload = function(e) {
            const imageData = e.target.result;
            
            let customStyle = document.getElementById('customTemplateStyle');
            if (!customStyle) {
                customStyle = document.createElement('style');
                customStyle.id = 'customTemplateStyle';
                document.head.appendChild(customStyle);
            }
            
            customStyle.textContent = `
                .theme-custom {
                    background-image: url('${imageData}');
                    background-size: cover;
                    background-position: center;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                }
            `;
            
            themeSelect.value = 'custom';
            currentTheme = 'custom';
            
            alert('Background image loaded successfully! Generate slides to see the changes.');
        };
        reader.readAsDataURL(file);
    }
}

function applyJsonTemplate(template) {
    let customStyle = document.getElementById('customTemplateStyle');
    if (!customStyle) {
        customStyle = document.createElement('style');
        customStyle.id = 'customTemplateStyle';
        document.head.appendChild(customStyle);
    }
    
    const css = `
        .theme-custom {
            background: ${template.background || '#ffffff'};
            color: ${template.textColor || '#333333'};
            font-family: ${template.fontFamily || 'Arial, sans-serif'};
        }
        .theme-custom h1 {
            color: ${template.titleColor || '#000000'};
            font-size: ${template.titleSize || '3.5em'};
        }
        .theme-custom h2 {
            background: ${template.subtitleBg || 'rgba(0,0,0,0.1)'};
            color: ${template.subtitleColor || '#666666'};
            font-size: ${template.subtitleSize || '2em'};
        }
        .theme-custom ul li:before {
            content: "${template.bulletIcon || '→'}";
            color: ${template.bulletColor || template.titleColor || '#000000'};
        }
    `;
    
    customStyle.textContent = css;
    themeSelect.value = 'custom';
    currentTheme = 'custom';
}

function updateSlideDisplay() {
    const allSlides = slidesContainer.querySelectorAll('.slide');
    
    allSlides.forEach((slide, index) => {
        if (index === currentSlideIndex) {
            slide.classList.add('active');
        } else {
            slide.classList.remove('active');
        }
    });
    
    currentSlideSpan.textContent = currentSlideIndex + 1;
    totalSlidesSpan.textContent = slides.length;
    
    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === slides.length - 1;
}

function previousSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateSlideDisplay();
    }
}

function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        updateSlideDisplay();
    }
}

function backToEdit() {
    presentationSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
}

function toggleExportMenu() {
    exportMenu.classList.toggle('show');
}

function handleExport(format) {
    switch(format) {
        case 'pdf':
            exportAsPdf();
            break;
        case 'ppt':
            exportAsPpt();
            break;
        case 'txt':
            exportAsTxt();
            break;
        case 'html':
            exportAsHtml();
            break;
    }
}

function exportAsPdf() {
    window.print();
}

function exportAsTxt() {
    let textContent = '';
    
    slides.forEach((slide, index) => {
        textContent += `SLIDE ${index + 1}\n`;
        textContent += '='.repeat(50) + '\n\n';
        
        if (slide.title) {
            textContent += slide.title.toUpperCase() + '\n\n';
        }
        
        if (slide.subtitle) {
            textContent += slide.subtitle + '\n\n';
        }
        
        if (slide.bullets.length > 0) {
            slide.bullets.forEach(bullet => {
                textContent += '• ' + bullet + '\n';
            });
        }
        
        textContent += '\n\n';
    });
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function exportAsPpt() {
    if (typeof PptxGenJS === 'undefined') {
        alert('PowerPoint library is loading. Please try again in a moment.');
        return;
    }

    const pptx = new PptxGenJS();
    
    // Get theme colors - matching the CSS themes
    const themeColors = {
        modern: { bg: '667eea', text: 'FFFFFF', titleColor: 'FFFFFF', subtitleBg: 'FFFFFF33', subtitleColor: 'FFFFFF' },
        minimal: { bg: 'FFFFFF', text: '000000', titleColor: '000000', subtitleBg: 'f0f0f0', subtitleColor: '667eea' },
        dark: { bg: '1a1a2e', text: 'EEEEEE', titleColor: '00d4ff', subtitleBg: '00d4ff33', subtitleColor: '00d4ff' },
        gradient: { bg: 'f5576c', text: 'FFFFFF', titleColor: 'FFFFFF', subtitleBg: 'FFFFFF40', subtitleColor: 'FFFFFF' },
        custom: { bg: 'FFFFFF', text: '333333', titleColor: '000000', subtitleBg: 'f0f0f0', subtitleColor: '667eea' }
    };
    
    const colors = themeColors[currentTheme] || themeColors.modern;
    
    slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();
        
        // Set background color
        slide.background = { color: colors.bg };
        
        let yPos = 1.0;
        
        // Add title
        if (slideData.title) {
            slide.addText(slideData.title, {
                x: 0.5,
                y: yPos,
                w: 9,
                h: 1.2,
                fontSize: 44,
                bold: true,
                color: colors.titleColor,
                align: 'center'
            });
            yPos += 1.5;
        }
        
        // Add subtitle with background
        if (slideData.subtitle) {
            slide.addText(slideData.subtitle, {
                x: 2,
                y: yPos,
                w: 6,
                h: 0.8,
                fontSize: 28,
                color: colors.subtitleColor,
                align: 'center',
                fill: { color: colors.subtitleBg }
            });
            yPos += 1.2;
        }
        
        // Add images
        if (slideData.images && slideData.images.length > 0) {
            try {
                slide.addImage({
                    path: slideData.images[0],
                    x: 3.5,
                    y: yPos,
                    w: 3,
                    h: 2
                });
                yPos += 2.3;
            } catch (error) {
                console.log('Could not add image to PowerPoint:', error);
            }
        }
        
        // Add bullets
        if (slideData.bullets.length > 0) {
            const bulletText = slideData.bullets.map(b => ({ text: b, options: { bullet: true } }));
            slide.addText(bulletText, {
                x: 1.0,
                y: yPos,
                w: 8,
                h: 4,
                fontSize: 24,
                color: colors.text,
                valign: 'top'
            });
        }
    });
    
    pptx.writeFile({ fileName: 'presentation.pptx' });
}

function exportAsHtml() {
    const allSlides = slidesContainer.querySelectorAll('.slide');
    
    // Get custom template styles if they exist
    const customStyle = document.getElementById('customTemplateStyle');
    const customCSS = customStyle ? customStyle.textContent : '';
    
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuickSlides Presentation</title>
    <style>
        /* Reset & Base */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #000;
            overflow: hidden;
        }
        
        /* Slide Container */
        .slide { 
            width: 100vw; 
            height: 100vh; 
            padding: 60px; 
            display: none;
            flex-direction: column; 
            justify-content: center; 
            page-break-after: always;
            background-size: cover;
            background-position: center;
            position: relative;
        }
        
        .slide.active {
            display: flex;
        }
        
        /* Typography */
        .slide h1 { 
            font-size: 3.5em; 
            margin-bottom: 20px; 
            line-height: 1.2; 
        }
        
        .slide h2 { 
            font-size: 2em; 
            margin-bottom: 30px; 
            opacity: 0.9; 
            padding: 10px 20px; 
            border-radius: 8px; 
            display: inline-block; 
        }
        
        .slide ul { 
            list-style: none; 
            font-size: 1.5em; 
            line-height: 1.8; 
        }
        
        .slide ul li { 
            margin-bottom: 15px; 
            padding-left: 40px; 
            position: relative; 
        }
        
        .slide ul li:before { 
            content: "→"; 
            position: absolute; 
            left: 0; 
            font-weight: bold; 
        }
        
        /* Images */
        .slide img { 
            max-width: 500px; 
            max-height: 300px; 
            border-radius: 10px; 
            margin: 20px 0; 
            object-fit: cover; 
            box-shadow: 0 5px 15px rgba(0,0,0,0.3); 
        }
        
        /* Image Positioning */
        .slide.img-top img { 
            order: -1; 
            margin-bottom: 30px; 
        }
        
        .slide.img-bottom img { 
            order: 999; 
            margin-top: 30px; 
        }
        
        .slide.img-background img { 
            display: none; 
        }
        
        .slide.img-background { 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8); 
        }
        
        /* Themes - EXACT copy from styles.css */
        .theme-modern { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
        }
        
        .theme-modern h2 { 
            background: rgba(255, 255, 255, 0.2); 
            color: #fff; 
        }
        
        .theme-minimal { 
            background: white; 
            color: #333; 
        }
        
        .theme-minimal h1 { 
            color: #000; 
            border-bottom: 4px solid #333; 
            padding-bottom: 20px; 
        }
        
        .theme-minimal h2 { 
            background: #f0f0f0; 
            color: #667eea; 
        }
        
        .theme-dark { 
            background: #1a1a2e; 
            color: #eee; 
        }
        
        .theme-dark h1 { 
            color: #00d4ff; 
        }
        
        .theme-dark h2 { 
            background: rgba(0, 212, 255, 0.2); 
            color: #00d4ff; 
        }
        
        .theme-gradient { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
            color: white; 
        }
        
        .theme-gradient h2 { 
            background: rgba(255, 255, 255, 0.25); 
            color: #fff; 
        }
        
        .theme-custom { 
            background: var(--custom-bg, #ffffff); 
            color: var(--custom-text, #333333); 
        }
        
        .theme-custom h1 { 
            color: var(--custom-title, #000000); 
        }
        
        .theme-custom h2 { 
            background: var(--custom-subtitle-bg, #f0f0f0); 
            color: var(--custom-subtitle, #667eea); 
        }
        
        /* Custom Template Styles */
        ${customCSS}
        
        /* Print Styles */
        @media print { 
            .slide { 
                page-break-after: always;
                display: flex !important;
            } 
            body { background: none; }
        }
    </style>
</head>
<body>
<!-- QuickSlides Presentation - Theme: ${currentTheme} - Slides: ${slides.length} -->
`;

    allSlides.forEach((slide, index) => {
        console.log(`Exporting slide ${index + 1}:`, {
            classes: slide.className,
            hasBackgroundImage: slide.style.backgroundImage ? 'Yes' : 'No',
            backgroundImage: slide.style.backgroundImage,
            innerHTML: slide.innerHTML.substring(0, 100)
        });
        htmlContent += slide.outerHTML + '\n';
    });

    htmlContent += `
    <script>
        let current = 0;
        const slides = document.querySelectorAll('.slide');
        function show(n) {
            slides.forEach((s, i) => s.style.display = i === n ? 'flex' : 'none');
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' && current < slides.length - 1) show(++current);
            if (e.key === 'ArrowLeft' && current > 0) show(--current);
        });
        show(0);
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    a.click();
    URL.revokeObjectURL(url);
}


