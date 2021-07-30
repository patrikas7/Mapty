'use strict';

// Navigation button implementation
const navigationButton = document.querySelector('.navigation__button');
const navigationBackground = document.querySelector('.navigation__background');
const navigationButtonFirstLine = document.querySelector('.navigation__button-line--1');
const navigationButtonSecondLine = document.querySelector('.navigation__button-line--2');
const navigationButtonThridLine = document.querySelector('.navigation__button-line--3');
const navigationContent = document.querySelector('.navigation__content');
let navigationIsOn = false;

navigationButton.addEventListener('click', function() {
    navigationIsOn = !navigationIsOn;
    navigationIsOn ? toggleNavigation('scale(80)', 'transparent', 'add') : toggleNavigation('scale(0)', '#000', 'remove');
});

/**
 * Toggles navigation button to show and hide content
 * Navigation button appears on mobile screen size
 */
const toggleNavigation = function(scale, backgroundColor, flag) {
    navigationBackground.style.transform = scale;
    navigationButtonSecondLine.style.backgroundColor = backgroundColor;

    if(flag === 'add') {
        navigationButtonFirstLine.classList.add('rotate-first');
        navigationButtonThridLine.classList.add('rotate-second');
        navigationContent.classList.add('show-navigation');
        return;
    }

    navigationButtonFirstLine.classList.remove('rotate-first');
    navigationButtonThridLine.classList.remove('rotate-second');
    navigationContent.classList.remove('show-navigation');
}

const loginPopup = document.querySelector('.popup');
const loginButton = document.querySelectorAll('.log-in-button');
const popupCloseButton = document.querySelector('.popup__close');

const signupPopup = document.querySelector('.popup--signup');
const signupButton = document.querySelectorAll('.sign-up-button');
const signupCloseButton = document.querySelector('.popup__close--signup');

const initPopupButtons = function(entryButton, closeButton, popup) {
    entryButton[0].addEventListener('click', () => togglePopup(popup, 'visible', 100));
    entryButton[1].addEventListener('click', () => togglePopup(popup, 'visible', 100));
    closeButton.addEventListener('click', () => togglePopup(popup, 'hidden', 0));
}

initPopupButtons(loginButton, popupCloseButton, loginPopup);
initPopupButtons(signupButton, signupCloseButton, signupPopup);

//Toggles log in popup to be visable/hidden
const togglePopup = function(popup, visibility, opacity) {
    popup.style.visibility = visibility; 
    popup.style.opacity = opacity;
}


// Section reveal on scroll
const mainBox = document.querySelectorAll('.main-box');
const showcaseSection = document.querySelector('.section-showcase');
const outroSection = document.querySelector('.outro');
const slider = document.querySelector('.slider');
const footerHeader = document.querySelector('.footer__header');

const setRevealStyle = function(element, observer, entry) {
    element.style.opacity = 1;
    element.style.transform = 'translateY(0)';
    observer.unobserve(entry.target);
}

const observeHeader = function(entries, observer) {
    const [entry] = entries;
    if(!entry.isIntersecting) return;
    mainBox.forEach(box => box.style.opacity = 1);
    observer.unobserve(entry.target);
}

const observerShowcase = function(entries, observer) {
    const [entry] = entries;
    if(!entry.isIntersecting) return;
    setRevealStyle(showcaseSection, observer, entry);
}

const observerOutro = function(entries, observer) {
    const [entry] = entries;
    if(!entry.isIntersecting) return;
    setRevealStyle(outroSection, observer, entry);
}

const observeSlider = function(entries, observer) {
    const [entry] = entries;
    if(!entry.isIntersecting) return;
    setRevealStyle(slider, observer, entry);
}

const observeFooter = function(entries, observer) {
    const [entry] = entries;
    if(!entry.isIntersecting) return;
    setRevealStyle(footerHeader, observer, entry);
}

let observerOptions = {
    root: null,
    threshold: 0.5
}

var intersectionObserverHeader = new IntersectionObserver(observeHeader, observerOptions);
var intersectionObserverShowcase = new IntersectionObserver(observerShowcase, observerOptions);
var intersectionObserverOutro = new IntersectionObserver(observerOutro, observerOptions);
var intersectionObserverSlider = new IntersectionObserver(observeSlider, observerOptions);
var intersectionObserverFooter = new IntersectionObserver(observeFooter, observerOptions);

const observeElements = [mainBox[0], showcaseSection, outroSection, slider, footerHeader];
const inteserctionObservers = [intersectionObserverHeader, intersectionObserverShowcase, intersectionObserverOutro,
    intersectionObserverSlider, intersectionObserverFooter];

inteserctionObservers.forEach((observer, index) => observer.observe(observeElements[index]));


// Slider implementation for section challanges
const challangesSlider = function() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const leftArrow = document.querySelector('.arrow--left');
    const rightArrow = document.querySelector('.arrow--right');
    const slideCount = slides.length;
    var currentSlide = 0;

    rightArrow.addEventListener('click', function(){
        currentSlide === slideCount - 1 ? currentSlide = 0 : currentSlide++;
        changeSlide();
        changeDot();
    });

    leftArrow.addEventListener('click', function(){
        currentSlide === 0 ? currentSlide = 2 : currentSlide--;
        changeSlide();
        changeDot();
    });

    const changeSlide = function() {
        slides.forEach((slide,index) => slide.style.transform = `translateX(${(index - currentSlide)*100}%)`);
    }

    const changeDot = function() {
        dots.forEach(dot => dot.classList.remove('dot--active'));
        dots[currentSlide].classList.add('dot--active');
    }
}

challangesSlider();