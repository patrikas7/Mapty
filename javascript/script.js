'use strict';

// TODO: position map to show all workouts
// TODO: draw line and shapes on the map
// TODO: Display weather data for workout time and place

const workoutForm = document.querySelector('.workout-form');
const workoutDistance = document.getElementById('dictance');
const workoutDuration = document.getElementById('duration');
const workoutCadance = document.getElementById('cadence');
const workoutType = document.querySelector('.workout-type');
const workoutCadanceLabel = document.querySelector('.cadance-label');
const sideBar = document.querySelector('.side-bar');
const sortButton = document.querySelector('.sort-btn');
const workoutConfirmation = document.querySelector('.alert');
const alertCloseButton = document.querySelector('.btn-close');
const formCloseButton = document.querySelector('.close-icon');
const deleteWorkoutsButton = document.querySelector('.delete-confirmation-btn');
const deleteAllButton = document.querySelector('.delete-btn');
const closeSideBarButton = document.querySelector('.left-icon');
const refreshButton = document.querySelector('.refresh-icon');
const APIKEY = '8d26bd1555011ca493a72285cfa68107';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Base workout object
class Workout{
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coordinates, distance, duration){
        this.coordinates = coordinates; // array
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

}

class Running extends Workout{
    type = 'Running';
    constructor(coordinates, distance, duration, cadence){
        super(coordinates, distance, duration);
        this.cadence = cadence;
        this.calcPace();
    }

    calcPace(){
        this.pace = this.duration / this.distance;
    }

}

class Cycling extends Workout{
    type = 'Cycling';
    constructor(coordinates, distance, duration, elevationGain){
        super(coordinates, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
    }

    calcSpeed(){
        this.speed = this.distance / (this.duration / 60);
    }
}

// App object
class App {
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13;
    #sorted = false;
    #oldWorkout;

    constructor(){
        this._getPosition();
        this._getLocalStorage();
        workoutForm.addEventListener('submit', this._newWorkout.bind(this));
        workoutType.addEventListener('change', this._toggleElevationField.bind(this));
        sideBar.addEventListener('click', this._moveToPopup.bind(this));
        alertCloseButton.addEventListener('click', function(){
            workoutConfirmation.style.display = 'none';
        });
        formCloseButton.addEventListener('click', this._hideForm);
        deleteWorkoutsButton.addEventListener('click', this._deleteAllWorkouts.bind(this));
    }

    // Geolocation API for getting users location   
    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
                alert('Could not get your position');
             });
        }
    }

    // Map is being displayed using 3rd party leaflet library
    _loadMap(position){
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot//{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        // Event listener on the map
        this.#map.on('click', this._showForm.bind(this));   

        this.#workouts.forEach(workout => this._rednerWorkoutPopUp(workout));
        this._getWeatherData(latitude.toFixed(2), longitude.toFixed(2));

    }

    // Shows workout form on sidebar
    _showForm(mapE){
        this.#mapEvent = mapE;

        if(this.#mapEvent.originalEvent.target.classList.contains('refresh-icon')) {

        }else{
            workoutForm.style.display = 'block'; 
            workoutDistance.focus();
        }
    }

    // Hides form from sidebar
    _hideForm(){
        workoutDistance.value = workoutDuration.value = workoutCadance.value ='';
        workoutForm.style.display = 'none';
    }

    // Toggles inputs label and placeholder based on workout type
    _toggleElevationField(){
        if(workoutCadance.placeholder === 'step/min'){
            workoutCadance.placeholder = 'meters';
            workoutCadanceLabel.innerHTML = 'Elev gain';
        }else{
            workoutCadance.placeholder = 'step/min';
            workoutCadanceLabel.innerHTML = 'Cadence';
        }
    }

    // Creates new workout object and validates inputs
    _newWorkout(e){
        e.preventDefault();
        const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input));
        const allPositve = (...inputs) => inputs.every(input => input > 0);
        var isOldObject = false;
        var lat, lng;
        let workout;
        const type = workoutType.value;
        const distance = +workoutDistance.value;
        const duration = +workoutDuration.value

        // If workout is being edited, its coordinated assinged to lat and lng
        if(this.#oldWorkout){
            [lat, lng] = this.#oldWorkout.coordinates;
            isOldObject = true;
        }else{
            ({lat, lng} = this.#mapEvent.latlng);
        } 
        
        if(type === 'Running'){
            const cadence = +workoutCadance.value;
            if(!validInputs(distance, duration, cadence) || !allPositve(distance, duration, cadence)){
                this._hideForm();
                return alert('Inputs have to be positive numbers');
            }

            workout = new Running([lat, lng], distance, duration, cadence);
        }

        if(type === 'Cycling'){
            const elevation = +workoutCadance.value;
            if(!validInputs(distance, duration, elevation) || !allPositve(distance, duration)){
                this._hideForm();
                return alert('Inputs have to be positive numbers');
            }

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        if(isOldObject){
            var objectIndex = this.#workouts.indexOf(this.#oldWorkout);
            workout.date = this.#oldWorkout.date;
            this.#workouts[objectIndex] = workout;            
            this._getOldWorkoutElement().remove();
            this._removeLayer(workout);
            this.#oldWorkout = null;
            
        }else{
            this.#workouts.push(workout);
        }

        this._rednerWorkoutPopUp(workout);
        this._renderWorkout(workout);
        
        if(this.#workouts.length > 0){
            this._toggleButtons('block');
        }

        this._hideForm();
        this._setLocalStorage();
        this._toggleAlerts('alert-danger', 'alert-success', 'Your workout has been saved!');
    }

    // Gets edited workout html element
    _getOldWorkoutElement(){
        const allWorkouts = document.querySelectorAll('.workout-details');
        var workout;
        allWorkouts.forEach(work => {
            if(work.dataset.id === this.#oldWorkout.id){
                workout = work;
            }
        });

        return workout;
    }

    // Renders pop up on the map
    _rednerWorkoutPopUp(workout){
        L.marker(workout.coordinates).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100, 
            autoClose: false, 
            closeOnClick: false, 
            className: `popUp${workout.type}`})).setPopupContent(`${workout.type === 'Running' ? '🏃‍♂️' :  '🚴‍♂️'} ${this._getDescription(workout)}`).openPopup();
    }

    // Removes workout popup and marker
    _removeLayer(workout){
        let layers = [];
        this.#map.eachLayer(function(layer){
            var lat, lng;
            if(layer._latlng){
                ({lat, lng} = layer._latlng);

                if(JSON.stringify([lat, lng]) == JSON.stringify(workout.coordinates)){
                    layers.push(layer);
                }
            }
        
        });

       layers.forEach(layer => this.#map.removeLayer(layer));
    }

    // Renders created workout in sidebar 
    _renderWorkout(workout){
        let html = `
        <div class="workout-details workout-${workout.type} p-2 mt-3" data-id="${workout.id}">
        <a><i class="fas fa-edit icon"></i></a>
        <a><i class="fas fa-trash-alt icon2"></i></a>
        <p class="workout-date text-start"><b>${this._getDescription(workout)}</b></p>
        <div class="d-flex justify-content-around">
          <p>${workout.type === 'Running' ? '🏃‍♂️' :  '🚴‍♂️'} ${workout.distance} <span class="workout-unit text-uppercase">km</span></p>
          <p>⏱ ${workout.duration} <span class="workout-unit text-uppercase">min</span></p>`

      if(workout.type === 'Running'){
          html += `
          <p>⚡ ${workout.pace.toFixed(1)} <span class="workout-unit text-uppercase">min/km</span></p>
          <p>🦶 ${workout.cadence} <span class="workout-unit text-uppercase">spm</span></p>
          </div>
          </div>`;
      }else{
        html += `
        <p>⚡ ${workout.speed.toFixed(1)} <span class="workout-unit text-uppercase">km.h</span></p>
        <p>🗻 ${workout.elevationGain} <span class="workout-unit text-uppercase">m</span></p>
        </div>
        </div>`;
      }

      workoutForm.insertAdjacentHTML('afterend', html);
    };

    // Moves to workout marker when workout is being clicked
    _moveToPopup(e){
        if(e.target.classList.contains('icon2')){
            this._deleteWorkout(e);
        }else if(e.target.classList.contains('icon')){
            this._editWorkout(e);
        }else if(e.target.classList.contains('sort-btn')){
            this._sortWorkouts(e);
        }else{
            const workoutElement = e.target.closest('.workout-details');
            if(!workoutElement) return;
            const workout = this.#workouts.find(work => work.id === workoutElement.dataset.id);
            this.#map.setView(workout.coordinates, this.#mapZoomLevel, {
                animate: true,
                pan: {
                    duration: 1
                }
            });
        }
    }

    // Generated description for workout
    _getDescription(workout){
        return `${workout.type[0].toUpperCase()}${workout.type.slice(1)} on ${months[new Date(workout.date).getMonth()]} ${new Date(workout.date).getDate()}`;
    }

    // Gets data from local storage and converts it to object
    _getLocalStorage(){
       const data = JSON.parse(localStorage.getItem('workouts'));

       if(!data) return;
        this.#workouts = data;
        this.#workouts.forEach(workout =>{
            if(workout.type === 'Running'){
                Object.setPrototypeOf(workout, Running.prototype);
            }else{
                Object.setPrototypeOf(workout, Cycling.prototype);
            };
             this._renderWorkout(workout)
        });
        if(this.#workouts.length > 0){
            sortButton.style.display = 'block';
            deleteAllButton.style.display = 'block';
        }
    }

    // Stores workout data in the local storage
    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));    
    }

    // Shows selected workout data in form
    _editWorkout(e){
        workoutForm.style.display = 'block'; 
        this._toggleElevationField();
        
        const workoutElement = e.target.closest('.workout-details');
        if(!workoutElement){
            return;
        }
        const workout = this.#workouts.find(work => work.id === workoutElement.dataset.id);
        workoutDistance.value = workout.distance;
        workoutDuration.value = workout.duration;
        workout.type === 'Running' ? workoutCadance.value = workout.cadence : workoutCadance.value = workout.elevationGain;
        workoutType.value = workout.type;
        this.#oldWorkout = workout;
    }

    // Deletes all workouts from local storage
    _deleteAllWorkouts(){
        this.#workouts = [];
        this._setLocalStorage();
        location.reload();
    }

    // Deletes clicked workouts
    _deleteWorkout(e){
        const workoutElement = e.target.closest('.workout-details');
        if(!workoutElement){
            return;
        }
        const workout = this.#workouts.find(work => work.id === workoutElement.dataset.id);
        const workoutIndex = this.#workouts.indexOf(workout);
        this.#workouts.splice(workoutIndex, 1);
        if(this.#workouts.length === 0 ){
             this._toggleButtons('none');
        }
        this._setLocalStorage();
        this._refreshWorkoutList();
        this._removeLayer(workout);
        this._toggleAlerts('alert-success', 'alert-danger', 'Your workout has been removed!');
    }

    // Sorts workouts by distance descending and ascending order
    _sortWorkouts(e){
        if(!this.#sorted){
            this.#sorted = true;
            this.#workouts.sort(function(a, b){
                return a.distance - b.distance;
            });
            sortButton.innerHTML = 'Sort ⬆'
        }else{
            this.#sorted = false;
            this.#workouts.sort(function(a, b){
                return b.distance - a.distance;
            });
            sortButton.innerHTML = 'Sort ⬇'
        }

        this._refreshWorkoutList();
    }

    // Refreshes workout list in the sidebar
    _refreshWorkoutList(){
        const allWorkouts = document.querySelectorAll('.workout-details');
        allWorkouts.forEach(workout => workout.remove());
        this.#workouts.forEach(workout => this._renderWorkout(workout));
    }

    // Toggles alerts for removing workout and adding/editing workout
    _toggleAlerts(removeClass, addClass, textContent){
        workoutConfirmation.classList.remove(`${removeClass}`);
        workoutConfirmation.classList.add(`${addClass}`);
        document.querySelector('.alert-message').textContent = `${textContent}`;
        workoutConfirmation.style.display = 'block';
        setTimeout((() => workoutConfirmation.style.display = 'none'), 2000)
    }

    // Toggles sort and delete all buttons
    _toggleButtons(display){
        sortButton.style.display = `${display}`;
        deleteAllButton.style.display = `${display}`;
    }

    async _getWeatherData(latitude, longitude){
        const location = document.querySelector('.location');
        fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=8d26bd1555011ca493a72285cfa68107`)
            .then(respone => {
                if(!respone.ok) {
                    throw new Error('Weather data not found!');
                }

                return respone.json();
            }).then(data => {
                const {name, weather, main} = data;
                const [weatherData] = weather;
                let temperature;
                console.log(weatherData);
                if(weatherData.main === 'Clear') temperature =`☀ ${main.temp.toFixed(0)}°`
                else if(weatherData.main === 'Snow') temperature =`🌨 ${main.temp.toFixed(0)}°`
                else if(weatherData.main === 'Rain') temperature =`🌧 ${main.temp.toFixed(0)}°`
                else if(weatherData.main === 'Clouds') temperature =`☁ ${main.temp.toFixed(0)}°`

                location.textContent = `${temperature} ${name}`;
            }).catch(err => console.log(err));
    }

    // _hideSidebar(){
    //     sideBar.style.display = 'none';
    // }

   
}

const app = new App();